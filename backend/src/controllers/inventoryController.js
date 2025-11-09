/*
 * inventoryController.js
 *
 * Provides functions to manage inventory/ingredients in the database.
 * Handles CRUD operations for ingredients: get all, add, delete, set/get quantity.
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool(process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : undefined);

/**
 * Fetch all ingredients from the `ingredient` table and return as an array of objects.
 * Each object: { id, name, quantity, unit }
 */
async function getAllIngredients() {
    const client = await pool.connect();
    try {
        const query = `SELECT ingredient_id, ingredient_name, quantity, unit FROM ingredient ORDER BY ingredient_id`;
        const res = await client.query(query);
        const ingredients = res.rows.map((r) => ({
            id: r.ingredient_id == null ? null : Number(r.ingredient_id),
            name: r.ingredient_name || null,
            quantity: r.quantity == null ? null : Number(r.quantity),
            unit: r.unit || null,
        }));
        return ingredients;
    } catch (err) {
        console.error('Error fetching ingredients', err);
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Express handler to return all ingredients as JSON
 */
async function getIngredientsHandler(req, res) {
    try {
        const ingredients = await getAllIngredients();
        res.json({ success: true, ingredients });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}

/**
 * Insert a new ingredient into the database.
 * Returns the created ingredient object { id, name, quantity, unit } on success.
 * Throws on error.
 */
async function addIngredient(name, quantity, unit) {
    const client = await pool.connect();
    try {
        const insertSql = `INSERT INTO ingredient (ingredient_name, quantity, unit) VALUES ($1, $2, $3) RETURNING ingredient_id`;
        const res = await client.query(insertSql, [name, quantity, unit]);
        const id = res.rows[0] && res.rows[0].ingredient_id ? Number(res.rows[0].ingredient_id) : null;
        return { id, name, quantity, unit };
    } finally {
        client.release();
    }
}

/**
 * Express handler to create an ingredient via POST /api/ingredients
 * Expects JSON body: { name, quantity, unit }
 */
async function addIngredientHandler(req, res) {
    try {
        const { name, quantity, unit } = req.body || {};
        if (!name || quantity == null || !unit) {
            return res.status(400).json({ success: false, error: 'name, quantity, and unit are required' });
        }
        
        const qty = Number(quantity);
        if (isNaN(qty)) {
            return res.status(400).json({ success: false, error: 'quantity must be a valid number' });
        }

        const created = await addIngredient(name, qty, unit);
        console.log(`New ingredient created: id=${created.id} name=${created.name} quantity=${created.quantity} unit=${created.unit}`);
        res.status(201).json(created);
    } catch (err) {
        console.error('Error creating ingredient', err);
        res.status(500).json({ success: false, error: err.message });
    }
}

/**
 * Delete an ingredient from the database by ID.
 * Returns true if successful, throws on error.
 */
async function deleteIngredient(id) {
    const client = await pool.connect();
    try {
        const deleteSql = `DELETE FROM ingredient WHERE ingredient_id = $1`;
        await client.query(deleteSql, [id]);
        return true;
    } finally {
        client.release();
    }
}

/**
 * Express handler to delete an ingredient via DELETE /api/ingredients/:id
 */
async function deleteIngredientHandler(req, res) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, error: 'Invalid ingredient ID' });
        }

        await deleteIngredient(id);
        console.log(`Ingredient deleted: id=${id}`);
        res.json({ success: true, message: 'Ingredient deleted successfully' });
    } catch (err) {
        console.error('Error deleting ingredient', err);
        res.status(500).json({ success: false, error: err.message });
    }
}

/**
 * Update the quantity of an ingredient in the database.
 * Returns true if successful, throws on error.
 */
async function setIngredientQuantity(id, quantity) {
    const client = await pool.connect();
    try {
        const updateSql = `UPDATE ingredient SET quantity = $1 WHERE ingredient_id = $2`;
        await client.query(updateSql, [quantity, id]);
        return true;
    } finally {
        client.release();
    }
}

/**
 * Express handler to update ingredient quantity via PUT /api/ingredients/:id/quantity
 * Expects JSON body: { quantity }
 */
async function setIngredientQuantityHandler(req, res) {
    try {
        const id = parseInt(req.params.id);
        const { quantity } = req.body || {};
        
        if (isNaN(id)) {
            return res.status(400).json({ success: false, error: 'Invalid ingredient ID' });
        }
        if (quantity == null) {
            return res.status(400).json({ success: false, error: 'quantity is required' });
        }

        const qty = Number(quantity);
        if (isNaN(qty)) {
            return res.status(400).json({ success: false, error: 'quantity must be a valid number' });
        }

        await setIngredientQuantity(id, qty);
        console.log(`Ingredient quantity updated: id=${id} quantity=${qty}`);
        res.json({ success: true, message: 'Quantity updated successfully' });
    } catch (err) {
        console.error('Error updating ingredient quantity', err);
        res.status(500).json({ success: false, error: err.message });
    }
}

/**
 * Get the quantity of a specific ingredient by ID.
 * Returns the quantity as a number, throws on error.
 */
async function getIngredientQuantity(id) {
    const client = await pool.connect();
    try {
        const query = `SELECT quantity FROM ingredient WHERE ingredient_id = $1`;
        const res = await client.query(query, [id]);
        if (res.rows.length === 0) {
            throw new Error('Ingredient not found');
        }
        return Number(res.rows[0].quantity);
    } finally {
        client.release();
    }
}

/**
 * Express handler to get ingredient quantity via GET /api/ingredients/:id/quantity
 */
async function getIngredientQuantityHandler(req, res) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, error: 'Invalid ingredient ID' });
        }

        const quantity = await getIngredientQuantity(id);
        res.json({ success: true, id, quantity });
    } catch (err) {
        console.error('Error fetching ingredient quantity', err);
        res.status(500).json({ success: false, error: err.message });
    }
}

module.exports = {
    getAllIngredients,
    getIngredientsHandler,
    addIngredient,
    addIngredientHandler,
    deleteIngredient,
    deleteIngredientHandler,
    setIngredientQuantity,
    setIngredientQuantityHandler,
    getIngredientQuantity,
    getIngredientQuantityHandler
};