/**
 * POS Controller
 * ---------------------------------------------------------
 * Handles the cashier checkout process:
 *  - Inserts a new receipt into the receipts table
 *  - Inserts each ordered item into the orders table
 *  - Returns the receipt ID to the frontend
 *
 * Dependencies:
 *   - Requires db.js in /backend to export a connected pg client or pool
 *     Example:
 *        const { Pool } = require('pg');
 *        const db = new Pool({ connectionString: process.env.DATABASE_URL });
 *        module.exports = db;
 */

const db = require('../config/db'); // make sure db.js exports a connected PG client

// POST /api/pos/checkout
exports.checkoutHandler = async (req, res) => {
  try {
    const { cart, subtotal, total, tip, phone } = req.body;
    const now = new Date();

    // 1️⃣ Insert a new receipt
    const receiptResult = await db.query(
      `INSERT INTO receipts (date, subtotal, total, tip, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [now, subtotal, total, tip, phone || null]
    );
    const receiptId = receiptResult.rows[0].id;

    // 2️⃣ Insert each item in the order
    for (const item of cart) {
      await db.query(
        `INSERT INTO orders (receipt_id, item_id, qty, price)
         VALUES ($1, $2, $3, $4)`,
        [receiptId, item.id, item.qty, item.price]
      );
    }

    // 3️⃣ Respond success
    res.json({ success: true, receiptId });
  } catch (err) {
    console.error('❌ Error in checkoutHandler:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
