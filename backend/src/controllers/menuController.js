/*
 * menuController.js
 *
 * Provides functions to manage menu in database
 * Handles CRUD operations for menu: get all, add, delete, set/get quantity.
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool(process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : undefined);


/**
 * Fetch all items from the `item` table and return as an array of objects.
 * Only returns items where is_visible is true.
 * Each object: { id, name, category, price, hotAvail, ingredientCount, ingredients }
 */
async function getAllItems() {
  const client = await pool.connect();
  try {
    // First get all items with ingredient count
    const query = `
      SELECT 
        i.item_id, 
        i.item_name, 
        i.category, 
        i.price, 
        COALESCE(i.hot_avail, false) as hot_avail,
        COUNT(r.ingredient_id) as ingredient_count
      FROM item i
      LEFT JOIN recipe r ON i.item_id = r.item_id
      WHERE i.is_visible = true
      GROUP BY i.item_id, i.item_name, i.category, i.price, i.hot_avail
      ORDER BY i.item_id
    `;
    const res = await client.query(query);
    
    // Then get ingredient names for each item
    const ingredientsQuery = `
      SELECT 
        r.item_id,
        ing.ingredient_name
      FROM recipe r
      JOIN ingredient ing ON r.ingredient_id = ing.ingredient_id
      ORDER BY r.item_id, ing.ingredient_name
    `;
    const ingredientsRes = await client.query(ingredientsQuery);
    
    // Group ingredients by item_id
    const ingredientsByItem = {};
    ingredientsRes.rows.forEach(row => {
      if (!ingredientsByItem[row.item_id]) {
        ingredientsByItem[row.item_id] = [];
      }
      ingredientsByItem[row.item_id].push(row.ingredient_name);
    });
    
    const items = res.rows.map((r) => ({
      id: r.item_id == null ? null : Number(r.item_id),
      name: r.item_name || null,
      category: r.category || null,
      price: r.price == null ? null : Number(r.price),
      hotAvail: r.hot_avail === true,
      ingredientCount: r.ingredient_count == null ? 0 : Number(r.ingredient_count),
      ingredients: ingredientsByItem[r.item_id] || [],
    }));
    return items;
  } catch (err) {
    console.error('Error fetching items', err);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Express handler to return items as JSON
 */
async function getItemsHandler(req, res) {
  try {
    const items = await getAllItems();
    res.json({ success: true, items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Update the price of an item in the database.
 * Returns true if successful, throws on error.
 */
async function setItemPrice(id, price) {
  const client = await pool.connect();
  try {
    const updateSql = `UPDATE item SET price = $1 WHERE item_id = $2`;
    await client.query(updateSql, [price, id]);
    return true;
  } finally {
    client.release();
  }
}

/**
 * Express handler to update item price via PUT /api/menu/:id/price
 * Expects JSON body: { price }
 */
async function setItemPriceHandler(req, res) {
  try {
    const id = parseInt(req.params.id);
    const { price } = req.body || {};

    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Invalid item ID' });
    }
    if (price == null) {
      return res.status(400).json({ success: false, error: 'price is required' });
    }

    const pri = Number(price);
    if (isNaN(pri)) {
      return res.status(400).json({ success: false, error: 'price must be a valid number' });
    }

    await setItemPrice(id, pri);
    console.log(`Item price updated: id=${id} price=${pri}`);
    res.json({ success: true, message: 'Price updated successfully' });
  } catch (err) {
    console.error('Error updating item price', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

// --- GET all categories ---
async function getCategories(req, res) {
  try {
    const result = await pool.query(
      'SELECT DISTINCT category FROM item ORDER BY category;'
    );
    const categories = result.rows.map(r => r.category);
    res.json({ success: true, categories });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

// --- GET all ingredients ---
async function getIngredients(req, res) {
  try {
    const result = await pool.query(
      'SELECT ingredient_id, ingredient_name FROM ingredient ORDER BY ingredient_name;'
    );
    res.json({ success: true, ingredients: result.rows });
  } catch (err) {
    console.error('Error fetching ingredients:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

// --- POST add a new item ---
async function addItem(req, res) {
  const client = await pool.connect();
  try {
    const { name, price, category, hotAvail, ingredientIDs } = req.body;

    if (!name || !price || !category || !Array.isArray(ingredientIDs) || ingredientIDs.length === 0) {
      return res.status(400).json({ success: false, error: 'Missing required fields.' });
    }

    await client.query('BEGIN');

    // Get next item_id
    const idResult = await client.query('SELECT COALESCE(MAX(item_id), 0) + 1 AS next_id FROM item;');
    const nextItemId = idResult.rows[0].next_id;

    // Insert item with hot_avail (default to false if not provided)
    await client.query(
      'INSERT INTO item (item_id, item_name, category, price, hot_avail, is_visible) VALUES ($1, $2, $3, $4, $5, $6)',
      [nextItemId, name, category, price, hotAvail === true, true]
    );

    // Insert recipe
    for (const ingId of ingredientIDs) {
      await client.query('INSERT INTO recipe (item_id, ingredient_id) VALUES ($1, $2)', [nextItemId, ingId]);
    }

    await client.query('COMMIT');
    res.json({ success: true, message: `Item '${name}' added successfully`, item_id: nextItemId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error adding item:', err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
}


// --- DELETE item by setting is_visible to false ---
async function deleteItem(req, res) {
  const client = await pool.connect();
  try {
    const itemId = parseInt(req.params.id);

    if (isNaN(itemId)) {
      return res.status(400).json({ success: false, error: 'Invalid item ID' });
    }

    // Update item to set is_visible to false
    const result = await client.query(
      'UPDATE item SET is_visible = false WHERE item_id = $1 RETURNING item_id, item_name',
      [itemId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    const item = result.rows[0];
    console.log(`Item deleted (is_visible set to false): id=${itemId} name=${item.item_name}`);
    res.json({ success: true, message: `Item '${item.item_name}' deleted successfully` });
  } catch (err) {
    console.error('Error deleting item:', err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
}

module.exports = {
  getAllItems,
  getItemsHandler,
  setItemPrice,
  setItemPriceHandler,
  getCategories,
  getIngredients,
  addItem,
  deleteItem
};