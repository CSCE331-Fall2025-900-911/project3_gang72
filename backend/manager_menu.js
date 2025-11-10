// require('dotenv').config();

const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// middlewares
app.use(express.json());

// controllers (require and validate handlers)
let empCtrl;
let reportCtrl;
let invCtrl;
let menuCtrl;
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

try {
  menuCtrl = require('./src/controllers/menuController');
} catch (e) {
  console.error('Failed to require menuController:', e && e.stack ? e.stack : e);
  process.exit(1);
}

// auth and oauth controllers (optional)
let authCtrl;
try {
  authCtrl = require('./src/controllers/authController');
} catch (e) {
  console.warn('No authController found; /api/auth/google will not be mounted.');
}
let oauthCtrl;
try {
  oauthCtrl = require('./src/controllers/oauthController');
} catch (e) {
  console.warn('No oauthController found; /auth/google and /oauth2/callback will not be mounted.');
}

console.log('authController exports:', authCtrl && Object.keys(authCtrl));
console.log('type verifyTokenHandler:', authCtrl && typeof authCtrl.verifyTokenHandler);

// debug: print available exports and types before mounting routes
console.log('employeeController exports:', empCtrl && Object.keys(empCtrl));
console.log('type getEmployeesHandler:', empCtrl && typeof empCtrl.getEmployeesHandler);
console.log('type addEmployeeHandler:', empCtrl && typeof empCtrl.addEmployeeHandler);
console.log('reportController exports:', reportCtrl && Object.keys(reportCtrl));
console.log('type xReportHandler:', reportCtrl && typeof reportCtrl.xReportHandler);
console.log('type dailySummaryHandler:', reportCtrl && typeof reportCtrl.dailySummaryHandler);
console.log('inventoryController exports:', invCtrl && Object.keys(invCtrl));
console.log('type getIngredientsHandler:', invCtrl && typeof invCtrl.getIngredientsHandler);


// Serve frontend static files (if built) and fallback to index.html for SPA routes
const staticDir = path.join(__dirname, '..', 'frontend', 'dist');
if (staticDir) {
  app.use(express.static(staticDir));
  // Fallback for SPA routes: serve index.html for non-API/auth requests
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path.startsWith('/oauth2')) return next();
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}

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

// Google auth verification endpoint (expects JSON body { id_token: string })
if (authCtrl && typeof authCtrl.verifyTokenHandler === 'function') {
  app.post('/api/auth/google', authCtrl.verifyTokenHandler);
} else {
  console.warn('/api/auth/google not mounted because authController.verifyTokenHandler is not available');
}

// Authorization-code flow endpoints (popup/redirect)
if (oauthCtrl && typeof oauthCtrl.getAuthUrlHandler === 'function') {
  app.get('/auth/google', oauthCtrl.getAuthUrlHandler);
}
if (oauthCtrl && typeof oauthCtrl.oauthCallbackHandler === 'function') {
  app.get('/oauth2/callback', oauthCtrl.oauthCallbackHandler);
}

//Menu routes
app.get('/api/menu', menuCtrl.getItemsHandler);
app.put('/api/menu/:id/price', menuCtrl.setItemPriceHandler);
app.get('/api/categories', menuCtrl.getCategories);
app.get('/api/ingredients', menuCtrl.getIngredients);
app.post('/api/items', menuCtrl.addItem);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


