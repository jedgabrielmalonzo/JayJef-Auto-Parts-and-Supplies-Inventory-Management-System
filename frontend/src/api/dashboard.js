import { request, toQuery } from './client.js';

export function getOverview() {
  return request('/dashboard/overview');
}

export function getSalesPurchaseChart(params = {}) {
  return request(`/dashboard/sales-purchase-chart${toQuery(params)}`);
}

export function getOrderSummaryChart() {
  return request('/dashboard/order-summary-chart');
}

export function getTopSelling() {
  return request('/dashboard/top-selling');
}
