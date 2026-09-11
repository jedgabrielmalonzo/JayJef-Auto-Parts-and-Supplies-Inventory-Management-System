import { request, toQuery } from './client.js';

export function listSuppliers(params = {}) {
  return request(`/suppliers${toQuery(params)}`);
}

export function getSupplier(id) {
  return request(`/suppliers/${id}`);
}

export function createSupplier(data) {
  return request('/suppliers', { method: 'POST', body: JSON.stringify(data) });
}

export function updateSupplier(id, data) {
  return request(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteSupplier(id) {
  return request(`/suppliers/${id}`, { method: 'DELETE' });
}

export function getSupplierProducts(id) {
  return request(`/suppliers/${id}/products`);
}

export function updateSupplierProducts(id, productIds) {
  return request(`/suppliers/${id}/products`, {
    method: 'POST',
    body: JSON.stringify({ product_ids: productIds }),
  });
}

