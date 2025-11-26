// backend/manager_menu.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require("path");
const app = express();
const router = express.Router();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Load controllers safely
let empCtrl, reportCtrl, invCtrl, menuCtrl, orderCtrl, speechRoutes, translationCtrl, authCtrl, oauthCtrl;

try {
  empCtrl = require('./src/controllers/employeeController');
  reportCtrl = require('./src/controllers/ReportController');
  invCtrl = require('./src/controllers/inventoryController');
  menuCtrl = require('./src/controllers/menuController');
  orderCtrl = require('./src/controllers/orderController');
} catch (e) {
  console.error('Controller load error:', e);
  process.exit(1);
}

// Load auth controllers (optional)
try {
  authCtrl = require('./src/controllers/authController');
  console.log('✅ authController loaded');
} catch (e) {
  console.warn('⚠️  authController not available:', e.message);
}

try {
  oauthCtrl = require('./src/controllers/oauthController');
  console.log('✅ oauthController loaded');
} catch (e) {
  console.warn('⚠️  oauthController not available:', e.message);
}

console.log('employeeController exports:', Object.keys(empCtrl));
console.log('reportController exports:', Object.keys(reportCtrl));
console.log('inventoryController exports:', Object.keys(invCtrl));
console.log('orderController exports:', Object.keys(orderCtrl));

// ===== Employee Routes =====
app.get('/api/employees', empCtrl.getEmployeesHandler || orderCtrl.getEmployees);
app.post('/api/employees', empCtrl.addEmployeeHandler);

// Update employee
app.put('/api/employees/:id', async (req, res) => {
  const empId = Number(req.params.id);
  const { firstName, lastName, password } = req.body;
  const { pool } = require('./db');

  try {
    const client = await pool.connect();
    let updateFields = [];
    let values = [];
    let paramCount = 1;

    if (firstName) {
      updateFields.push(`first_name = $${paramCount++}`);
      values.push(firstName);
    }
    if (lastName) {
      updateFields.push(`last_name = $${paramCount++}`);
      values.push(lastName);
    }
    if (password) {
      updateFields.push(`password = $${paramCount++}`);
      values.push(password);
    }

    values.push(empId);
    const sql = `UPDATE employee SET ${updateFields.join(', ')} WHERE employee_id = $${paramCount}`;
    await client.query(sql, values);
    client.release();

    res.json({ success: true });
  } catch (err) {
    console.error('Error updating employee:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete employee
app.delete('/api/employees/:id', async (req, res) => {
  const empId = Number(req.params.id);
  const { pool } = require('./db');
  try {
    const client = await pool.connect();
    await client.query('DELETE FROM employee WHERE employee_id = $1', [empId]);
    client.release();
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting employee:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== Reports (using orderController functions) =====
app.get('/api/reports/popular-items', orderCtrl.getMostPopularItems);
app.get('/api/reports/revenue', orderCtrl.getTotalRevenue);
app.get('/api/reports/total-orders', orderCtrl.getTotalOrders);
app.get('/api/reports/avg-order-value', orderCtrl.getAvgOrderValue);
app.get('/api/reports/peak-hours', orderCtrl.getPeakHours);
app.get('/api/reports/orders-by-hour', orderCtrl.getOrdersByHour);
app.get('/api/reports/order-volume', orderCtrl.getOrderVolume);
app.get('/api/reports/revenue-chart', orderCtrl.getRevenueChart);
app.get('/api/reports/aov-by-category', orderCtrl.getAOVByCategory);

// Report endpoints
app.get('/api/x-report', reportCtrl.xReportHandler);
app.get('/api/z-report', reportCtrl.zReportHandler);
const dailyHandler = reportCtrl.dailySummaryHandler || reportCtrl.zReportHandler || reportCtrl.zReport;
if (typeof dailyHandler === 'function') {
  app.get('/api/daily-summary', dailyHandler);
} else {
  console.warn('⚠️ No daily summary handler found.');
}

// ===== Inventory =====
app.get('/api/ingredients', invCtrl.getIngredientsHandler || orderCtrl.getIngredients);
app.post('/api/ingredients', invCtrl.addIngredientHandler);
app.delete('/api/ingredients/:id', invCtrl.deleteIngredientHandler);
app.put('/api/ingredients/:id/quantity', invCtrl.setIngredientQuantityHandler);
app.get('/api/ingredients/:id/quantity', invCtrl.getIngredientQuantityHandler);

// ===== Menu =====
app.get('/api/menu', menuCtrl.getItemsHandler || orderCtrl.getMenu);
app.put('/api/menu/:id/price', menuCtrl.setItemPriceHandler || orderCtrl.updateItemPrice);
app.get('/api/categories', menuCtrl.getCategories);
app.post('/api/items', menuCtrl.addItem);

// ===== Orders =====
app.post('/api/orders', orderCtrl.createOrder);
app.get('/api/orders/receipt/:receiptId', orderCtrl.getOrderByReceipt);

// ===== Sales =====
app.get('/api/sales', orderCtrl.getSales);

// ===== Google OAuth Authentication =====
if (authCtrl && typeof authCtrl.verifyTokenHandler === 'function') {
  app.post('/api/auth/google', authCtrl.verifyTokenHandler);
  console.log('✅ Mounted: POST /api/auth/google');
} else {
  console.warn('⚠️  /api/auth/google not mounted (authController.verifyTokenHandler missing)');
}

if (oauthCtrl && typeof oauthCtrl.getAuthUrlHandler === 'function') {
  app.get('/auth/google', oauthCtrl.getAuthUrlHandler);
  console.log('✅ Mounted: GET /auth/google');
} else {
  console.warn('⚠️  /auth/google not mounted (oauthController.getAuthUrlHandler missing)');
}

if (oauthCtrl && typeof oauthCtrl.oauthCallbackHandler === 'function') {
  app.get('/oauth2/callback', oauthCtrl.oauthCallbackHandler);
  console.log('✅ Mounted: GET /oauth2/callback');
} else {
  console.warn('⚠️  /oauth2/callback not mounted (oauthController.oauthCallbackHandler missing)');
}

//==========WEATHER=============
app.get('/api/weather', async (req, res) => {
  try {
    // College Station example
    const lat = 30.61;
    const lon = -96.34;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode&temperature_unit=fahrenheit`;

    const response = await fetch(url);
    const data = await response.json();

    res.json({
      temperature: data.current.temperature_2m,
      weatherCode: data.current.weathercode
    });

  } catch (err) {
    console.error("Weather API error:", err);
    res.status(500).json({ error: "Weather fetch failed" });
  }
});

// Translation routes
app.post('/api/translate', translationCtrl.translateHandler);
app.post('/api/translate/batch', translationCtrl.batchTranslateHandler);

// ===== Google OAuth Authentication =====
if (authCtrl && typeof authCtrl.verifyTokenHandler === 'function') {
  app.post('/api/auth/google', authCtrl.verifyTokenHandler);
  console.log('✅ Mounted: POST /api/auth/google');
} else {
  console.warn('⚠️  /api/auth/google not mounted (authController.verifyTokenHandler missing)');
}

if (oauthCtrl && typeof oauthCtrl.getAuthUrlHandler === 'function') {
  app.get('/auth/google', oauthCtrl.getAuthUrlHandler);
  console.log('✅ Mounted: GET /auth/google');
} else {
  console.warn('⚠️  /auth/google not mounted (oauthController.getAuthUrlHandler missing)');
}

if (oauthCtrl && typeof oauthCtrl.oauthCallbackHandler === 'function') {
  app.get('/oauth2/callback', oauthCtrl.oauthCallbackHandler);
  console.log('✅ Mounted: GET /oauth2/callback');
} else {
  console.warn('⚠️  /oauth2/callback not mounted (oauthController.oauthCallbackHandler missing)');
}

//==========WEATHER=============
app.get('/api/weather', async (req, res) => {
  try {
    // College Station example
    const lat = 30.61;
    const lon = -96.34;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode&temperature_unit=fahrenheit`;

    const response = await fetch(url);
    const data = await response.json();

    res.json({
      temperature: data.current.temperature_2m,
      weatherCode: data.current.weathercode
    });

  } catch (err) {
    console.error("Weather API error:", err);
    res.status(500).json({ error: "Weather fetch failed" });
  }
});

// Translation routes
app.post('/api/translate', translationCtrl.translateHandler);
app.post('/api/translate/batch', translationCtrl.batchTranslateHandler);

// ===== Speech-to-Text =====
app.use("/api", speechRoutes);
// Serve frontend
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});



// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET  /api/employees');
  console.log('  GET  /api/ingredients');
  console.log('  GET  /api/menu');
  console.log('  GET  /api/sales');
  console.log('  GET  /api/reports/popular-items');
  console.log('  GET  /api/reports/revenue');
  console.log('  GET  /api/reports/total-orders');
  console.log('  GET  /api/reports/avg-order-value');
  console.log('  GET  /api/reports/peak-hours');
  console.log('  GET  /api/reports/orders-by-hour');
  console.log('  GET  /api/reports/order-volume');
  console.log('  GET  /api/reports/revenue-chart');
  console.log('  GET  /api/reports/aov-by-category');
  console.log('  POST /api/translate');
  console.log('  POST /api/translate/batch');
});