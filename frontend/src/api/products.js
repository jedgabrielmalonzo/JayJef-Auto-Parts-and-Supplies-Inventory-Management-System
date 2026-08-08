import { request, toQuery } from './client.js';

export function listProducts(params = {}) {
  return request(`/products${toQuery(params)}`);
}

export function getProductLocations(params = {}) {
  return request(`/products/locations${toQuery(params)}`);
}

export function getProduct(id) {
  return request(`/products/${id}`);
}

export function createProduct(data) {
  return request('/products', { method: 'POST', body: JSON.stringify(data) });
}

export function updateProduct(id, data) {
  return request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteProduct(id, { hard = false } = {}) {
  return request(`/products/${id}${hard ? '?hard=true' : ''}`, { method: 'DELETE' });
}

export function reactivateProduct(id) {
  return request(`/products/${id}/reactivate`, { method: 'POST' });
}
