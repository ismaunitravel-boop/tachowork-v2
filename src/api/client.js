/**
 * API Client - Fetch wrapper base
 * Todas las llamadas a la API pasan por aquí
 */

const API_BASE = '/api';

export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  try {
    const res = await fetch(url, config);
    if (res.status === 204) return null;
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
    return data;
  } catch (err) {
    console.error(`API [${endpoint}]:`, err.message);
    throw err;
  }
}

export function get(endpoint) {
  return apiFetch(endpoint);
}

export function post(endpoint, body) {
  return apiFetch(endpoint, { method: 'POST', body: JSON.stringify(body) });
}

export function put(endpoint, body) {
  return apiFetch(endpoint, { method: 'PUT', body: JSON.stringify(body) });
}

export function del(endpoint) {
  return apiFetch(endpoint, { method: 'DELETE' });
}
