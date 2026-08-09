import { request } from './client.js';

export function listCabinets() {
  return request('/shop-layout');
}

export function createCabinet(data) {
  return request('/shop-layout', { method: 'POST', body: JSON.stringify(data) });
}

export function updateCabinet(id, data) {
  return request(`/shop-layout/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteCabinet(id) {
  return request(`/shop-layout/${id}`, { method: 'DELETE' });
}
