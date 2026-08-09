import * as analyticsModel from '../models/analyticsModel.js';

export async function getOverview(req, res, next) {
  try {
    res.json(await analyticsModel.overview());
  } catch (err) {
    next(err);
  }
}

export async function getSalesPurchaseChart(req, res, next) {
  try {
    res.json(await analyticsModel.salesPurchaseChart({ period: req.query.period }));
  } catch (err) {
    next(err);
  }
}

export async function getOrderSummaryChart(req, res, next) {
  try {
    res.json(await analyticsModel.orderSummaryChart());
  } catch (err) {
    next(err);
  }
}

export async function getTopSelling(req, res, next) {
  try {
    res.json(await analyticsModel.topSellingProducts());
  } catch (err) {
    next(err);
  }
}
