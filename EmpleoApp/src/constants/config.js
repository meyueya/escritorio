// EmpleoAutopilot iOS — Configuración Central
// Configure EXPO_PUBLIC_SERVER_URL for your own server; no LAN address is committed.
// Si cambia la IP de tu Mac, puedes editarla desde la pantalla de Ajustes de la app.

export const DEFAULT_SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || 'http://127.0.0.1:3001';
export const POLL_INTERVAL_MS = 3000; // Polling cada 3 segundos para los logs del autopilot
export const APP_VERSION = '1.0.0';
