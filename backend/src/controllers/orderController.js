// backend/src/controllers/orderController.js
const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool(process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : undefined);

/**
 * Expected POST body:
 * {
 *   "customer": { "firstName": "...", "lastName": "...", "phone": "..." },
 *   "tipPercent": 10,
 *   "items": [
 *     { "itemId": 1, "name": "Classic Milk Tea", "price": 4.99 },
 *     { "itemId": 15, "name": "Boba Topping", "price": 0.50 }
 *   ]
 * }
 *
 * Note: paymentMethod is optional and is ignored (not stored) per your comment.
 */

async function findCustomerIdByPhone(client, phone) {
  const sql = `SELECT customer_id FROM customer WHERE phone_number = $1`;
  const { rows } = await client.query(sql, [phone]);
  if (rows.length) return rows[0].customer_id;
  return null;
}

async function createCustomer(client, first, last, phone) {
  const nextIdSql = `SELECT COALESCE(MAX(customer_id), 0) + 1 AS next_id FROM customer`;
  const nextIdRes = await client.query(nextIdSql);
  const nextId = nextIdRes.rows[0].next_id;

  const insertSql = `
    INSERT INTO customer (customer_id, first_name, last_name, phone_number, rewards_points)
    VALUES ($1, $2, $3, $4, $5)
  `;
  await client.query(insertSql, [nextId, first || null, last || null, phone, 0]);
  return nextId;
}

async function pickRandomEmployee(client) {
  const sql = `SELECT employee_id FROM employee ORDER BY RANDOM() LIMIT 1`;
  const res = await client.query(sql);
  if (res.rows.length) return res.rows[0].employee_id;
  return 1; // fallback
}

async function createReceiptWithTip(client, employeeId, customerId, tipPercent, subtotal) {
  const tipAmount = Number((subtotal * (tipPercent / 100)).toFixed(2));

  // Generate next receipt_id
  const nextIdRes = await client.query(
    `SELECT COALESCE(MAX(receipt_id), 0) + 1 AS next_id FROM receipt`
  );
  const nextReceiptId = nextIdRes.rows[0].next_id;

  // Insert with generated receipt_id
  const result = await client.query(
    `INSERT INTO receipt (receipt_id, employee_id, customer_id, order_date, order_time, tip)
     VALUES ($1, $2, $3, CURRENT_DATE, EXTRACT(EPOCH FROM NOW()), $4)
     RETURNING receipt_id`,
    [nextReceiptId, employeeId, customerId, tipAmount]
  );

  return { receiptId: result.rows[0].receipt_id, tipAmount };
}





/**
 * Insert orders and topping associations, and decrement ingredient quantities.
 * items: array from request in order (toppings appear as items with category 'topping')
 * Returns list of orderIds inserted and number of toppings linked.
 */
async function insertOrdersAndConsumeIngredients(client, receiptId, items) {
  // 1) get topping item_ids (case-insensitive)
  const toppingIdsRes = await client.query(
    `SELECT item_id FROM item WHERE LOWER(category) = 'topping'`
  );
  const toppingIdSet = new Set(toppingIdsRes.rows.map(r => r.item_id));

  // 2) compute next order_id and next drink_id (for toppingstodrinks.drink_id)
  const maxOrderRes = await client.query(`SELECT COALESCE(MAX(order_id), 0) AS max_id FROM orders`);
  let nextOrderId = maxOrderRes.rows[0].max_id + 1;

  const maxDrinkRes = await client.query(`SELECT COALESCE(MAX(drink_id), 0) AS max_id FROM toppingstodrinks`);
  let nextDrinkId = maxDrinkRes.rows[0].max_id + 1;

  const insertOrderSql = `INSERT INTO orders (order_id, receipt_id, item_id) VALUES ($1, $2, $3)`;
  const insertToppingSql = `INSERT INTO toppingstodrinks (drink_id, order_id, item_id, topping_id) VALUES ($1, $2, $3, $4)`;
  const selectRecipeSql = `SELECT ingredient_id FROM recipe WHERE item_id = $1`;
  const updateIngredientSql = `UPDATE ingredient SET quantity = GREATEST(quantity - $1, 0) WHERE ingredient_id = $2`;

  const insertedOrderIds = [];

  let currentDrinkOrderId = -1;
  let currentDrinkItemId = -1;

  for (const it of items) {
    const itemId = Number(it.itemId);
    if (Number.isNaN(itemId)) continue;

    if (toppingIdSet.has(itemId)) {
      // Topping: attach to last drink if present
      if (currentDrinkOrderId !== -1) {
        await client.query(insertToppingSql, [nextDrinkId++, currentDrinkOrderId, currentDrinkItemId, itemId]);
      } else {
        // no drink for this topping — we'll still insert it as a standalone order
        const orderId = nextOrderId++;
        await client.query(insertOrderSql, [orderId, receiptId, itemId]);
        insertedOrderIds.push(orderId);
        // no topping link since no drink context
      }
    } else {
      // Drink: insert into orders
      const orderId = nextOrderId++;
      await client.query(insertOrderSql, [orderId, receiptId, itemId]);
      insertedOrderIds.push(orderId);

      currentDrinkOrderId = orderId;
      currentDrinkItemId = itemId;

      // Decrement ingredients per recipe: for each ingredient, subtract 1
      const recipeRes = await client.query(selectRecipeSql, [itemId]);
      for (const row of recipeRes.rows) {
        const ingId = row.ingredient_id;
        await client.query(updateIngredientSql, [1, ingId]);
      }
    }
  }

  return insertedOrderIds;
}

// ------------------ Controller: createOrder ------------------
async function createOrder(req, res) {
  const { customer, tipPercent = 0, items } = req.body;

  if (!customer || !customer.phone) {
    return res.status(400).json({ success: false, error: 'Customer phone is required' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, error: 'Order items are required' });
  }

  // compute total from provided item prices (client must pass prices)
  const total = items.reduce((acc, it) => {
    const p = Number(it.price);
    return acc + (Number.isFinite(p) ? p : 0);
  }, 0);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1) find or create customer
    let customerId = await findCustomerIdByPhone(client, customer.phone);
    if (!customerId) {
      customerId = await createCustomer(client, customer.firstName || null, customer.lastName || null, customer.phone);
    } else {
      // update rewards points: add floor(total)
      const rewardToAdd = Math.floor(total);
      await client.query(
        `UPDATE customer SET rewards_points = COALESCE(rewards_points,0) + $1 WHERE customer_id = $2`,
        [rewardToAdd, customerId]
      );
    }

    // 2) pick random employee
    const employeeId = await pickRandomEmployee(client);

    // 3) create receipt (computes tip)
    const { receiptId, tipAmount } = await createReceiptWithTip(client, employeeId, customerId, Number(tipPercent || 0), total);

    // 4) insert orders and update inventory
    const insertedOrderIds = await insertOrdersAndConsumeIngredients(client, receiptId, items);

    await client.query('COMMIT');

    return res.json({
      success: true,
      receiptId,
      orderIds: insertedOrderIds,
      total,
      tipAmount,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('createOrder failed:', err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
}

// (Optional) GET /api/orders/:receiptId to fetch order + items + toppings + receipt info
async function getOrderByReceipt(req, res) {
  const receiptId = Number(req.params.receiptId);
  if (Number.isNaN(receiptId)) return res.status(400).json({ success: false, error: 'Invalid receipt id' });

  try {
    // Get receipt
    const receiptRes = await pool.query(`SELECT * FROM receipt WHERE receipt_id = $1`, [receiptId]);
    if (!receiptRes.rows.length) return res.status(404).json({ success: false, error: 'Receipt not found' });

    const receipt = receiptRes.rows[0];

    // Get orders for receipt
    const ordersRes = await pool.query(`SELECT order_id, item_id FROM orders WHERE receipt_id = $1 ORDER BY order_id`, [receiptId]);
    const orders = ordersRes.rows;

    // Get toppings linked to drinks
    const toppingsRes = await pool.query(`SELECT * FROM toppingstodrinks WHERE order_id IN (SELECT order_id FROM orders WHERE receipt_id = $1)`, [receiptId]);

    return res.json({ success: true, receipt, orders, toppings: toppingsRes.rows });
  } catch (err) {
    console.error('getOrderByReceipt failed:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  createOrder,
  getOrderByReceipt,
};
