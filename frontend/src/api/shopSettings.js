import { request } from './client.js';

export function getSettings() {
  return request('/shop-settings');
}

export function updateSettings(data) {
  return request('/shop-settings', { method: 'PUT', body: JSON.stringify(data) });
}
