// require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// middlewares
app.use(cors());
app.use(express.json());

// controllers (require and validate handlers)
let empCtrl;
let reportCtrl;
let invCtrl;
try {
  empCtrl = require('./src/controllers/employeeController');
} catch (e) {
  console.error('Failed to require employeeController:', e && e.stack ? e.stack : e);
  process.exit(1);
}

try {
  reportCtrl = require('./src/controllers/ReportController');
} catch (e) {
  console.error('Failed to require ReportController:', e && e.stack ? e.stack : e);
  process.exit(1);
}

try {
  invCtrl = require('./src/controllers/inventoryController');
} catch (e) {
  console.error('Failed to require inventoryController:', e && e.stack ? e.stack : e);
  process.exit(1);
}

app.get('/', (req, res) => {
  res.send('POS Manager API running');
});

// debug: print available exports and types before mounting routes
console.log('employeeController exports:', empCtrl && Object.keys(empCtrl));
console.log('type getEmployeesHandler:', empCtrl && typeof empCtrl.getEmployeesHandler);
console.log('type addEmployeeHandler:', empCtrl && typeof empCtrl.addEmployeeHandler);
console.log('reportController exports:', reportCtrl && Object.keys(reportCtrl));
console.log('type xReportHandler:', reportCtrl && typeof reportCtrl.xReportHandler);
console.log('type dailySummaryHandler:', reportCtrl && typeof reportCtrl.dailySummaryHandler);
console.log('inventoryController exports:', invCtrl && Object.keys(invCtrl));
console.log('type getIngredientsHandler:', invCtrl && typeof invCtrl.getIngredientsHandler);

app.get('/', (req, res) => {
  res.send('POS Manager API running');
});

// API routes
app.get('/api/employees', empCtrl.getEmployeesHandler);
app.post('/api/employees', empCtrl.addEmployeeHandler);

app.get('/api/x-report', reportCtrl.xReportHandler);
// daily summary handler - support multiple export names for compatibility
const dailyHandler = reportCtrl.dailySummaryHandler || reportCtrl.zReportHandler || reportCtrl.zReport || reportCtrl.runDailySummary;
if (typeof dailyHandler === 'function') {
  app.get('/api/daily-summary', dailyHandler);
} else {
  console.warn('No daily summary handler exported from ReportController; /api/daily-summary not mounted. Exported keys:', reportCtrl && Object.keys(reportCtrl));
}

// Inventory routes
app.get('/api/ingredients', invCtrl.getIngredientsHandler);
app.post('/api/ingredients', invCtrl.addIngredientHandler);
app.delete('/api/ingredients/:id', invCtrl.deleteIngredientHandler);
app.put('/api/ingredients/:id/quantity', invCtrl.setIngredientQuantityHandler);
app.get('/api/ingredients/:id/quantity', invCtrl.getIngredientQuantityHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
