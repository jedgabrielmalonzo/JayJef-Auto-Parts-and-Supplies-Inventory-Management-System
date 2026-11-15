import { request, toQuery } from './client.js';

export function listMovements(params = {}) {
  return request(`/inventory/movements${toQuery(params)}`);
}

export function createMovement(data) {
  return request('/inventory/movements', { method: 'POST', body: JSON.stringify(data) });
}

export function createBatchMovements(data, userId) {
  let body;
  if (Array.isArray(data)) {
    body = { movements: data, user_id: userId };
  } else if (data && typeof data === 'object') {
    const movements = data.movements || data.adjustments || [];
    body = { ...data, movements, user_id: data.user_id || userId };
  } else {
    body = { movements: [], user_id: userId };
  }
  return request('/inventory/movements/batch', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function lowStock(params = {}) {
  return request(`/inventory/low-stock${toQuery(params)}`);
}

