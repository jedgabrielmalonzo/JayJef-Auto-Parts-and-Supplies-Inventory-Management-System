import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController.js';

const router = Router();

router.get('/overview', dashboardController.getOverview);
router.get('/sales-purchase-chart', dashboardController.getSalesPurchaseChart);
router.get('/order-summary-chart', dashboardController.getOrderSummaryChart);
router.get('/top-selling', dashboardController.getTopSelling);

export default router;
