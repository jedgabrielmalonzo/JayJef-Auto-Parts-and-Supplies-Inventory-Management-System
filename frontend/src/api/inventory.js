import { request, toQuery } from './client.js';

export function listMovements(params = {}) {
  return request(`/inventory/movements${toQuery(params)}`);
}

export function createMovement(data) {
  return request('/inventory/movements', { method: 'POST', body: JSON.stringify(data) });
}

export function createBatchMovements(movements, userId) {
  return request('/inventory/movements/batch', {
    method: 'POST',
    body: JSON.stringify({ movements, user_id: userId }),
  });
}

export function lowStock(params = {}) {
  return request(`/inventory/low-stock${toQuery(params)}`);
}

