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

// Image mapping for menu items
const ITEM_IMAGES = {
  // Milk Tea
  'Wintermelon Milk Tea': 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=400&q=80',
  'Strawberry Milk Tea': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80',
  'Milk Black Tea': 'https://images.unsplash.com/photo-1578374173705-64e9ae843b2f?w=400&q=80',
  'Oolong Tea': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80',
  'Pearl Milk Tea': 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=400&q=80',
  'Caramel Milk Tea': 'https://images.unsplash.com/photo-1578374173705-64e9ae843b2f?w=400&q=80',
  
  // Coffee
  'Milk Coffee': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80',
  'Coffee Milk Tea': 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&q=80',
  'Milk Foam Black Coffee': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80',
  
  // Tea Latte
  'Matcha Tea Latte': 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400&q=80',
  'Strawberry Matcha Latte': 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&q=80',
  'Thai Tea Latte': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&q=80',
  
  // Slush Series
  'Lychee': 'https://images.unsplash.com/photo-1546173159-315724a31696?w=400&q=80',
  'Taro Milk': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80',
  'Mango Milk': 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80',
  'Strawberry Milk': 'https://images.unsplash.com/photo-1541544181051-e46607bc22a4?w=400&q=80',
  
  // Toppings
  'Pearl': 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=400&q=80',
  'Coconut Jelly': 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=400&q=80',
  'Herbal Jelly': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80',
  'Ai-Yu Jelly': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80',
  'White Pearl': 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=400&q=80',
};

/**
 * Fetch all items from the `item` table and return as an array of objects.
 * Each object: { id, name, category, price, image }
 */
async function getAllItems() {
    const client = await pool.connect();
    try {
        const query = `SELECT item_id, item_name, category, price FROM item ORDER BY item_id`;
        const res = await client.query(query);
        const items = res.rows.map((r) => ({
            id: r.item_id == null ? null : Number(r.item_id),
            name: r.item_name || null,
            category: r.category || null,
            price: r.price == null ? null : Number(r.price),
            image: ITEM_IMAGES[r.item_name] || 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=400&q=80'
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
        res.json({ success: true, items});
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
    const { name, price, category, ingredientIDs } = req.body;

    if (!name || !price || !category || !Array.isArray(ingredientIDs) || ingredientIDs.length === 0) {
      return res.status(400).json({ success: false, error: 'Missing required fields.' });
    }

    await client.query('BEGIN');

    // Get next item_id
    const idResult = await client.query('SELECT COALESCE(MAX(item_id), 0) + 1 AS next_id FROM item;');
    const nextItemId = idResult.rows[0].next_id;

    // Insert item
    await client.query(
      'INSERT INTO item (item_id, item_name, category, price) VALUES ($1, $2, $3, $4)',
      [nextItemId, name, category, price]
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


module.exports = {
  getAllItems,
  getItemsHandler,
  setItemPrice,
  setItemPriceHandler,
  getCategories,
  getIngredients,
  addItem
};