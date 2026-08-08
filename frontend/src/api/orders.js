import { API_BASE, request, toQuery } from './client.js';

export function listOrders(params = {}) {
  return request(`/orders${toQuery(params)}`);
}

export function getOrder(id) {
  return request(`/orders/${id}`);
}

export function createOrder(data) {
  return request('/orders', { method: 'POST', body: JSON.stringify(data) });
}

export function updateOrder(id, data) {
  return request(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function confirmOrder(id) {
  return request(`/orders/${id}/confirm`, { method: 'POST' });
}

export function fulfillOrder(id) {
  return request(`/orders/${id}/fulfill`, { method: 'POST' });
}

export function cancelOrder(id) {
  return request(`/orders/${id}/cancel`, { method: 'POST' });
}

export function orderPdfUrl(id) {
  return `${API_BASE}/orders/${id}/pdf`;
}
