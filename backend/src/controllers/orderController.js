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

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '').slice(0, 10);
  if (digits.length !== 10) return { digits, formatted: null };
  const formatted = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return { digits, formatted };
}

async function findCustomerIdByPhone(client, phone) {
  const { digits } = normalizePhone(phone);
  if (digits.length !== 10) return null;

  const sql = `SELECT customer_id
               FROM customer
               WHERE regexp_replace(phone_number, '\\D', '', 'g') = $1`;
  const { rows } = await client.query(sql, [digits]);
  if (rows.length) return rows[0].customer_id;
  return null;
}

async function createCustomer(client, first, last, phone) {
  const { formatted } = normalizePhone(phone);
  if (!formatted) throw new Error('Phone number must be 10 digits');

  const nextIdSql = `SELECT COALESCE(MAX(customer_id), 0) + 1 AS next_id FROM customer`;
  const nextIdRes = await client.query(nextIdSql);
  const nextId = nextIdRes.rows[0].next_id;

  const insertSql = `
    INSERT INTO customer (customer_id, first_name, last_name, phone_number, order_count)
    VALUES ($1, $2, $3, $4, $5)
  `;
  await client.query(insertSql, [nextId, first || null, last || null, formatted, 0]);
  return nextId;
}

async function pickRandomEmployee(client) {
  const sql = `SELECT employee_id FROM employee ORDER BY RANDOM() LIMIT 1`;
  const res = await client.query(sql);
  if (res.rows.length) return res.rows[0].employee_id;
  return 1; // fallback
}

async function createReceiptWithTip(client, employeeId, customerId, tipPercent, subtotal, discountAmount = 0, rewardApplied = false, rewardType = null) {
  const tipAmount = Number((subtotal * (tipPercent / 100)).toFixed(2));

  // Generate next receipt_id
  const nextIdRes = await client.query(
    `SELECT COALESCE(MAX(receipt_id), 0) + 1 AS next_id FROM receipt`
  );
  const nextReceiptId = nextIdRes.rows[0].next_id;

  // Insert with generated receipt_id including discount fields
  const result = await client.query(
    `INSERT INTO receipt (receipt_id, employee_id, customer_id, order_date, order_time, tip, discount_amount, reward_applied, reward_type)
     VALUES ($1, $2, $3, CURRENT_DATE, ((EXTRACT(HOUR FROM NOW())::integer % 13) + 11), $4, $5, $6, $7)
     RETURNING receipt_id`,
    [nextReceiptId, employeeId, customerId, tipAmount, discountAmount, rewardApplied, rewardType]
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
  if (!customer.firstName || !customer.firstName.trim()) {
    return res.status(400).json({ success: false, error: 'Customer first name is required' });
  }
  if (!customer.lastName || !customer.lastName.trim()) {
    return res.status(400).json({ success: false, error: 'Customer last name is required' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, error: 'Order items are required' });
  }

  const { digits: phoneDigits, formatted: phoneFormatted } = normalizePhone(customer.phone);
  if (!phoneFormatted) {
    return res.status(400).json({ success: false, error: 'Phone number must be 10 digits (format xxx-xxx-xxxx)' });
  }

  // compute subtotal from provided item prices (client must pass prices)
  let subtotal = items.reduce((acc, it) => {
    const p = Number(it.price);
    return acc + (Number.isFinite(p) ? p : 0);
  }, 0);

  let discount = 0;
  let appliedReward = false;
  let rewardType = null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1) find or create customer
    let customerId = await findCustomerIdByPhone(client, phoneFormatted);

    if (!customerId) {
      customerId = await createCustomer(client, customer.firstName, customer.lastName, phoneFormatted);
    } else {
      // Increment order count by 1 per order and check if it's the 10th
      const updateRes = await client.query(
        `UPDATE customer SET order_count = COALESCE(order_count, 0) + 1 WHERE customer_id = $1 RETURNING order_count`,
        [customerId]
      );
      const newOrderCount = updateRes.rows[0].order_count;

      // Check if this is the 10th order (mod 10 = 0)
      if (newOrderCount % 10 === 0) {
        // 10th order: apply reward based on drinks in this order
        // Get topping IDs to exclude from drink count
        const toppingIdsRes = await client.query(
          `SELECT item_id FROM item WHERE LOWER(category) = 'topping'`
        );
        const toppingIdSet = new Set(toppingIdsRes.rows.map(r => r.item_id));
        
        // Count only non-topping items as drinks
        const drinksInOrder = items.filter(it => !toppingIdSet.has(Number(it.itemId))).length;

        if (drinksInOrder === 1) {
          discount = subtotal;
          rewardType = 'single-drink-free';
        } else if (drinksInOrder > 1) {
          discount = Number((subtotal * 0.2).toFixed(2));
          rewardType = 'multi-drink-20pct';
        }
        appliedReward = discount > 0;
      }
    }

    const totalAfterDiscount = subtotal - discount;

    // 3) pick random employee
    const employeeId = await pickRandomEmployee(client);

    // 4) create receipt (computes tip) and store discount info
    const { receiptId, tipAmount } = await createReceiptWithTip(
      client, 
      employeeId, 
      customerId, 
      Number(tipPercent || 0), 
      totalAfterDiscount,
      discount,
      appliedReward,
      rewardType
    );

    // 5) insert orders and update inventory
    const insertedOrderIds = await insertOrdersAndConsumeIngredients(client, receiptId, items);

    await client.query('COMMIT');

    return res.json({
      success: true,
      receiptId,
      orderIds: insertedOrderIds,
      subtotal,
      discount,
      total: totalAfterDiscount,
      tipAmount,
      rewardApplied: appliedReward,
      rewardType,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => { });
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

/**
 * GET /api/employees
 * Fetch all employees
 */
async function getEmployees(req, res) {
  try {
    const result = await pool.query(
      `SELECT employee_id AS id, first_name AS "firstName", last_name AS "lastName", 
              email, phone_number AS phone, position, hourly_wage AS wage
       FROM employee 
       ORDER BY employee_id`
    );

    return res.json(result.rows);
  } catch (err) {
    console.error('getEmployees failed:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/ingredients
 * Fetch all ingredients
 */
async function getIngredients(req, res) {
  try {
    const result = await pool.query(
      `SELECT ingredient_id AS id, ingredient_name AS name, quantity, unit
       FROM ingredient 
       ORDER BY ingredient_id`
    );

    return res.json(result.rows);
  } catch (err) {
    console.error('getIngredients failed:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/sales
 * Fetch all sales/receipts with total calculation
 */
async function getSales(req, res) {
  try {
    const result = await pool.query(
      `SELECT r.receipt_id AS id, 
              r.employee_id AS "employeeId", 
              r.customer_id AS "customerId", 
              r.order_date AS date, 
              r.order_time AS time, 
              r.tip,
              (SELECT SUM(i.price) 
               FROM orders o 
               JOIN item i ON o.item_id = i.item_id 
               WHERE o.receipt_id = r.receipt_id) + COALESCE(r.tip, 0) AS total
       FROM receipt r
       ORDER BY r.receipt_id DESC`
    );

    return res.json(result.rows);
  } catch (err) {
    console.error('getSales failed:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/menu
 * Get all menu items with prices
 */
async function getMenu(req, res) {
  try {
    const result = await pool.query(
      `SELECT item_id AS id, item_name AS name, category, price
       FROM item
       ORDER BY item_id, item_name`
    );

    return res.json(result.rows);
  } catch (err) {
    console.error('getMenu failed:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * PUT /api/menu/:itemId
 * Update item price
 * Body: { price: number }
 */
async function updateItemPrice(req, res) {
  const itemId = Number(req.params.itemId);
  const { price } = req.body;

  if (Number.isNaN(itemId) || !price) {
    return res.status(400).json({ success: false, error: 'Invalid item ID or price' });
  }

  try {
    const result = await pool.query(
      `UPDATE item SET price = $1 WHERE item_id = $2 RETURNING *`,
      [price, itemId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    return res.json({ success: true, item: result.rows[0] });
  } catch (err) {
    console.error('updateItemPrice failed:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/reports/popular-items?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Get most popular items for date range
 */
async function getMostPopularItems(req, res) {
  const { startDate, endDate } = req.query;
  const dateFilter = getDateFilter(startDate, endDate);

  try {
    const sql = `SELECT i.item_name AS name, COUNT(o.item_id) AS "totalSold"
                 FROM orders o
                 JOIN item i ON o.item_id = i.item_id
                 JOIN receipt r ON o.receipt_id = r.receipt_id
                 ${dateFilter}
                 GROUP BY i.item_name
                 ORDER BY "totalSold" DESC`;

    const result = await pool.query(sql);
    return res.json(result.rows);
  } catch (err) {
    console.error('getMostPopularItems failed:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/reports/revenue?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Get total revenue for date range
 */
async function getTotalRevenue(req, res) {
  const { startDate, endDate } = req.query;
  const dateFilter = getDateFilter(startDate, endDate);

  try {
    const sql = `SELECT SUM(i.price) + SUM(COALESCE(r.tip, 0)) + SUM(COALESCE(topping_item.price, 0)) AS "totalRevenue"
                 FROM receipt r
                 JOIN orders o ON r.receipt_id = o.receipt_id
                 JOIN item i ON o.item_id = i.item_id
                 LEFT JOIN toppingstodrinks td ON o.order_id = td.order_id
                 LEFT JOIN item topping_item ON td.topping_id = topping_item.item_id
                 ${dateFilter}`;

    const result = await pool.query(sql);
    return res.json({ totalRevenue: result.rows[0].totalRevenue || 0 });
  } catch (err) {
    console.error('getTotalRevenue failed:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/reports/total-orders?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Get total number of orders for date range
 */
async function getTotalOrders(req, res) {
  const { startDate, endDate } = req.query;
  const dateFilter = getDateFilter(startDate, endDate);

  try {
    const sql = `SELECT COUNT(DISTINCT r.receipt_id) AS "totalOrders"
                 FROM receipt r
                 ${dateFilter}`;

    const result = await pool.query(sql);
    return res.json({ totalOrders: result.rows[0].totalOrders || 0 });
  } catch (err) {
    console.error('getTotalOrders failed:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/reports/avg-order-value?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Get average order value for date range
 */
async function getAvgOrderValue(req, res) {
  const { startDate, endDate } = req.query;
  const dateFilter = getDateFilter(startDate, endDate);

  try {
    const sql = `SELECT AVG(order_total) AS "avgOrderValue"
                 FROM (
                   SELECT r.receipt_id, SUM(i.price) + COALESCE(r.tip, 0) AS order_total
                   FROM receipt r
                   JOIN orders o ON r.receipt_id = o.receipt_id
                   JOIN item i ON o.item_id = i.item_id
                   ${dateFilter}
                   GROUP BY r.receipt_id, r.tip
                 ) AS totals`;

    const result = await pool.query(sql);
    return res.json({ avgOrderValue: result.rows[0].avgOrderValue || 0 });
  } catch (err) {
    console.error('getAvgOrderValue failed:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/reports/peak-hours?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Get peak hours for date range
 */
async function getPeakHours(req, res) {
  const { startDate, endDate } = req.query;
  const dateFilter = getDateFilter(startDate, endDate);

  try {
    const sql = `SELECT r.order_time AS hour, COUNT(*) AS "orderCount"
                 FROM receipt r
                 ${dateFilter}
                 GROUP BY r.order_time
                 ORDER BY "orderCount" DESC
                 LIMIT 3`;

    const result = await pool.query(sql);
    const peakHours = result.rows.map(row => ({
      hour: row.hour,
      formatted: formatHour(row.hour),
      count: row.orderCount
    }));

    return res.json(peakHours);
  } catch (err) {
    console.error('getPeakHours failed:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/reports/orders-by-hour?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Get hourly order distribution
 */
async function getOrdersByHour(req, res) {
  const { startDate, endDate } = req.query;
  const dateFilter = getDateFilter(startDate, endDate);

  try {
    const sql = `SELECT r.order_time AS hour, COUNT(*) AS "orderCount"
                 FROM receipt r
                 ${dateFilter}
                 GROUP BY r.order_time
                 ORDER BY r.order_time`;

    const result = await pool.query(sql);
    const data = result.rows.map(row => ({
      hour: row.hour,
      formatted: formatHour(row.hour),
      count: row.orderCount
    }));

    return res.json(data);
  } catch (err) {
    console.error('getOrdersByHour failed:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/reports/order-volume?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Get order volume grouped by day or month depending on date range
 */
async function getOrderVolume(req, res) {
  const { startDate, endDate } = req.query;
  const dateFilter = getDateFilter(startDate, endDate);

  try {
    // Calculate day difference
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.abs((end - start) / (1000 * 60 * 60 * 24));

    let sql;
    if (diffDays > 31) {
      // Group by month
      sql = `SELECT TO_CHAR(r.order_date, 'YYYY-MM') AS period, COUNT(*) AS "orderCount"
             FROM receipt r
             ${dateFilter}
             GROUP BY TO_CHAR(r.order_date, 'YYYY-MM')
             ORDER BY period`;
    } else {
      // Group by day
      sql = `SELECT TO_CHAR(r.order_date, 'YYYY-MM-DD') AS period, COUNT(*) AS "orderCount"
             FROM receipt r
             ${dateFilter}
             GROUP BY TO_CHAR(r.order_date, 'YYYY-MM-DD')
             ORDER BY period`;
    }

    const result = await pool.query(sql);
    return res.json(result.rows);
  } catch (err) {
    console.error('getOrderVolume failed:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/reports/revenue-chart?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Get revenue grouped by day or month depending on date range
 */
async function getRevenueChart(req, res) {
  const { startDate, endDate } = req.query;
  const dateFilter = getDateFilter(startDate, endDate);

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.abs((end - start) / (1000 * 60 * 60 * 24));

    let sql;
    if (diffDays > 31) {
      sql = `SELECT TO_CHAR(r.order_date, 'YYYY-MM') AS period,
                    SUM(i.price) + SUM(COALESCE(r.tip, 0)) AS revenue
             FROM receipt r
             JOIN orders o ON r.receipt_id = o.receipt_id
             JOIN item i ON o.item_id = i.item_id
             ${dateFilter}
             GROUP BY TO_CHAR(r.order_date, 'YYYY-MM')
             ORDER BY period`;
    } else {
      sql = `SELECT TO_CHAR(r.order_date, 'YYYY-MM-DD') AS period,
                    SUM(i.price) + SUM(COALESCE(r.tip, 0)) AS revenue
             FROM receipt r
             JOIN orders o ON r.receipt_id = o.receipt_id
             JOIN item i ON o.item_id = i.item_id
             ${dateFilter}
             GROUP BY TO_CHAR(r.order_date, 'YYYY-MM-DD')
             ORDER BY period`;
    }

    const result = await pool.query(sql);
    return res.json(result.rows);
  } catch (err) {
    console.error('getRevenueChart failed:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/reports/aov-by-category?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Get average order value by category
 */
async function getAOVByCategory(req, res) {
  const { startDate, endDate } = req.query;
  const dateFilter = getDateFilter(startDate, endDate);

  try {
    const sql = `SELECT i.category, AVG(i.price) AS "avgPrice"
                 FROM item i
                 JOIN orders o ON i.item_id = o.item_id
                 JOIN receipt r ON o.receipt_id = r.receipt_id
                 ${dateFilter}
                 GROUP BY i.category
                 ORDER BY i.category`;

    const result = await pool.query(sql);
    return res.json(result.rows);
  } catch (err) {
    console.error('getAOVByCategory failed:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// Helper function to build date filter for SQL queries
function getDateFilter(startDate, endDate) {
  const hasStart = startDate && startDate.trim();
  const hasEnd = endDate && endDate.trim();

  if (!hasStart && !hasEnd) {
    return '';
  } else if (hasStart && hasEnd) {
    return `WHERE r.order_date BETWEEN '${startDate}' AND '${endDate}'`;
  } else if (hasStart) {
    return `WHERE r.order_date >= '${startDate}'`;
  } else {
    return `WHERE r.order_date <= '${endDate}'`;
  }
}

// Helper function to format hour (0-23 to 12 AM/PM format)
function formatHour(hour) {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

module.exports = {
  createOrder,
  getOrderByReceipt,
  getEmployees,
  getIngredients,
  getSales,
  getMenu,
  updateItemPrice,
  getMostPopularItems,
  getTotalRevenue,
  getTotalOrders,
  getAvgOrderValue,
  getPeakHours,
  getOrdersByHour,
  getOrderVolume,
  getRevenueChart,
  getAOVByCategory,
};
