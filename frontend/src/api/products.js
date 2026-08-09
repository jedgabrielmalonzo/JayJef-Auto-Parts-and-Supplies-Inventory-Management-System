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

// `data.image` (a File, optional) rides along as multipart/form-data — same
// pattern as uploadReceipt() in api/ocr.js. Only `undefined`/`null` fields
// are omitted — an empty string is a legitimate "clear this text field"
// value (e.g. removing a product photo sends image_path: ''). Numeric/FK
// fields (supplier_id, cost_price, etc.) are converted to `undefined` when
// blank by the caller before reaching here, since Postgres rejects '' for
// those column types.
function toProductFormData(data) {
  const form = new FormData();
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    form.append(key, value);
  }
  return form;
}

export function createProduct(data) {
  return request('/products', { method: 'POST', body: toProductFormData(data) });
}

export function updateProduct(id, data) {
  return request(`/products/${id}`, { method: 'PUT', body: toProductFormData(data) });
}

export function deleteProduct(id, { hard = false } = {}) {
  return request(`/products/${id}${hard ? '?hard=true' : ''}`, { method: 'DELETE' });
}

export function reactivateProduct(id) {
  return request(`/products/${id}/reactivate`, { method: 'POST' });
}
