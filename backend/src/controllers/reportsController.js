import * as analyticsModel from '../models/analyticsModel.js';

export async function getOverview(req, res, next) {
  try {
    res.json(await analyticsModel.reportsOverview());
  } catch (err) {
    next(err);
  }
}

export async function getBestSellingCategories(req, res, next) {
  try {
    res.json(await analyticsModel.bestSellingCategories());
  } catch (err) {
    next(err);
  }
}

export async function getProfitRevenueChart(req, res, next) {
  try {
    // Reuses the same monthly purchase-vs-sale totals as the Dashboard chart,
    // just remapped to revenue/profit terms instead of purchase/sales ones.
    const buckets = await analyticsModel.salesPurchaseChart({ period: 'month' });
    res.json(buckets.map((b) => ({ label: b.label, revenue: b.sales, profit: b.sales - b.purchase })));
  } catch (err) {
    next(err);
  }
}

export async function getBestSellingProducts(req, res, next) {
  try {
    res.json(await analyticsModel.bestSellingProducts());
  } catch (err) {
    next(err);
  }
}
