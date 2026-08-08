export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
export const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

export async function request(path, options) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: options?.body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `Request failed (${res.status})`);
    err.fields = body.fields;
    err.details = body.details;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

export function toQuery(params = {}) {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
  ).toString();
  return query ? `?${query}` : '';
}
