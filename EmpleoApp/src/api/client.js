import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SERVER_URL } from '../constants/config';

// Obtiene la URL base del servidor (puede ser modificada desde Ajustes)
export const getBaseUrl = async () => {
  try {
    const stored = await AsyncStorage.getItem('@server_url');
    return stored || DEFAULT_SERVER_URL;
  } catch {
    return DEFAULT_SERVER_URL;
  }
};

// Guarda una nueva URL del servidor
export const setBaseUrl = async (url) => {
  await AsyncStorage.setItem('@server_url', url);
};

// Helper central de fetch con timeout y manejo de errores
const fetchWithTimeout = async (url, options = {}, timeoutMs = 15000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Tiempo de espera agotado. ¿Está el servidor Node.js corriendo?');
    }
    throw error;
  }
};

// API client factory — obtiene la base URL y expone métodos get/post/put/delete
export const createApiClient = async () => {
  const BASE = await getBaseUrl();

  return {
    get: async (path) => {
      const res = await fetchWithTimeout(`${BASE}${path}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    post: async (path, body) => {
      const res = await fetchWithTimeout(`${BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return res.json();
    },
    put: async (path, body) => {
      const res = await fetchWithTimeout(`${BASE}${path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    delete: async (path) => {
      const res = await fetchWithTimeout(`${BASE}${path}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    // Para polling del status del autopilot (reemplaza SSE/EventSource)
    pollAutopilotStatus: async () => {
      const res = await fetchWithTimeout(`${BASE}/api/autopilot/status`, {}, 5000);
      if (!res.ok) return null;
      return res.json();
    },
  };
};
