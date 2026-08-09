import { request } from './client.js';

export function getOverview() {
  return request('/reports/overview');
}

export function getBestSellingCategories() {
  return request('/reports/best-selling-categories');
}

export function getProfitRevenueChart() {
  return request('/reports/profit-revenue-chart');
}

export function getBestSellingProducts() {
  return request('/reports/best-selling-products');
}
