import { request } from './client.js';

export function sendChatMessage(message) {
  return request('/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}
