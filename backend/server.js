import express from 'express';
import cors from 'cors';

import { checkoutHandler } from './src/controllers/posController.js';
import { getItemsHandler } from './src/controllers/menuController.js';
import { getIngredientsHandler } from './src/controllers/inventoryController.js';
import { xReportHandler, zReportHandler } from './src/controllers/ReportController.js';


const app = express();
app.use(cors());
app.use(express.json());

// const posController = require('./controllers/posController');

// existing controllers…
const posController     = require('./src/controllers/posController');
const menuController    = require('./src/controllers/menuController');
const inventoryController = require('./src/controllers/inventoryController');
const reportController  = require('./src/controllers/ReportController');

// your routes…
app.post('/api/pos/checkout', posController.checkoutHandler);
app.get('/api/menu/items', menuController.getItemsHandler);
app.get('/api/inventory/ingredients', inventoryController.getIngredientsHandler);
app.get('/api/reports/x', reportController.xReportHandler);
app.get('/api/reports/z', reportController.zReportHandler);

app.listen(8000, () => console.log('Backend running on port 8000'));
