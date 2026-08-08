import { request, toQuery } from './client.js';

export function listMovements(params = {}) {
  return request(`/inventory/movements${toQuery(params)}`);
}

export function createMovement(data) {
  return request('/inventory/movements', { method: 'POST', body: JSON.stringify(data) });
}

export function lowStock(params = {}) {
  return request(`/inventory/low-stock${toQuery(params)}`);
}
