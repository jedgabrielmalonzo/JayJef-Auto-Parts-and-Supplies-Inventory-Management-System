import { request } from './client.js';

export function listUsers() {
  return request('/users');
}

export function createUser(data) {
  return request('/users', { method: 'POST', body: JSON.stringify(data) });
}
