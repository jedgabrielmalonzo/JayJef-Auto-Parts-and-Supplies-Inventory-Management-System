import { Router } from 'express';
import * as reportsController from '../controllers/reportsController.js';

const router = Router();

router.get('/overview', reportsController.getOverview);
router.get('/best-selling-categories', reportsController.getBestSellingCategories);
router.get('/profit-revenue-chart', reportsController.getProfitRevenueChart);
router.get('/best-selling-products', reportsController.getBestSellingProducts);

export default router;
