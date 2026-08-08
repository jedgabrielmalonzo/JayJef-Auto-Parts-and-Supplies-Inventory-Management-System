import { request, toQuery } from './client.js';

export function uploadReceipt(file, supplierId) {
  const form = new FormData();
  form.append('image', file);
  if (supplierId) form.append('supplier_id', supplierId);
  return request('/ocr/receipts', { method: 'POST', body: form });
}

export function listReceipts(params = {}) {
  return request(`/ocr/receipts${toQuery(params)}`);
}

export function getReceipt(id) {
  return request(`/ocr/receipts/${id}`);
}

export function updateReceiptItems(id, items) {
  return request(`/ocr/receipts/${id}/items`, { method: 'PUT', body: JSON.stringify({ items }) });
}

export function confirmReceipt(id) {
  return request(`/ocr/receipts/${id}/confirm`, { method: 'POST' });
}

export function rejectReceipt(id) {
  return request(`/ocr/receipts/${id}/reject`, { method: 'POST' });
}
