/**
 * API Client - Fetch wrapper with retry & connection status
 * Todas las llamadas a la API pasan por aquí
 */

const API_BASE = '/api';

// --- Connection status (observable) ---
const listeners = new Set();
let connectionState = { status: 'unknown', lastSync: null, error: null };

export function getConnectionState() { return connectionState; }

export function onConnectionChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function setConnection(status, error = null) {
  connectionState = {
    status,
    error,
    lastSync: status === 'connected' ? new Date() : connectionState.lastSync,
  };
  listeners.forEach(fn => fn(connectionState));
}

// --- Retry logic ---
async function fetchWithRetry(url, config, retries = 3) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        // Exponential backoff: 2s, 4s, 8s
        const delay = Math.min(2000 * Math.pow(2, attempt - 1), 8000);
        setConnection('retrying', `Reintentando... (${attempt}/${retries})`);
        await new Promise(r => setTimeout(r, delay));
      }

      const res = await fetch(url, config);

      if (res.status === 503 || res.status === 502) {
        // Server waking up - retry
        lastError = new Error(`Servidor despertando (${res.status})`);
        continue;
      }

      // Connected!
      setConnection('connected');

      if (res.status === 204) return null;
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      return data;

    } catch (err) {
      lastError = err;
      // Network error → retry
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        continue;
      }
      // Server errors → retry
      if (err.message.includes('503') || err.message.includes('502') || err.message.includes('Failed to connect')) {
        continue;
      }
      // Other errors → don't retry
      break;
    }
  }

  setConnection('error', lastError?.message);
  console.error(`API [${url}]:`, lastError?.message);
  throw lastError;
}

export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };
  return fetchWithRetry(url, config);
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
