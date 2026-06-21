import { useState, useEffect, useRef, useCallback } from 'react';
import { createApiClient } from '../api/client';
import { POLL_INTERVAL_MS } from '../constants/config';
import { notifyJobFound, notifyAutopilotDone } from '../utils/notifications';

export const useAutopilot = (onJobFound) => {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [scrapedCount, setScrapedCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [error, setError] = useState(null);
  const pollIntervalRef = useRef(null);
  const lastLogCountRef = useRef(0);

  // Polling function: reemplaza SSE/EventSource
  const pollStatus = useCallback(async () => {
    try {
      const api = await createApiClient();
      const data = await api.pollAutopilotStatus();
      if (!data) return;

      setIsRunning(data.isRunning);

      if (data.logs && data.logs.length > lastLogCountRef.current) {
        const newLogs = data.logs.slice(lastLogCountRef.current);
        lastLogCountRef.current = data.logs.length;

        setLogs(prev => [...prev, ...newLogs]);

        // Contar estadísticas y disparar notificaciones
        newLogs.forEach(log => {
          if (log.status === 'scrape') {
            setScrapedCount(c => c + 1);
          }
          if (log.status === 'success') {
            setSuccessCount(c => c + 1);
            // Disparar notificación push si es un match
            if (log.matchScore >= 80 || log.message?.includes('Match')) {
              notifyJobFound(log.jobTitle || 'Nuevo empleo', log.company || '', log.matchScore || '');
              onJobFound?.();
            }
          }
        });

        // Detectar fin del autopilot
        const lastLog = newLogs[newLogs.length - 1];
        if (lastLog?.message?.includes('finalizado') || lastLog?.message?.includes('completado')) {
          setIsRunning(false);
          stopPolling();
          notifyAutopilotDone(lastLogCountRef.current);
          onJobFound?.();
        }
      }
    } catch (err) {
      // Silenciar errores de red durante polling para no saturar
      console.warn('Poll error:', err.message);
    }
  }, [onJobFound]);

  const startPolling = useCallback(() => {
    stopPolling();
    pollStatus(); // Inmediato
    pollIntervalRef.current = setInterval(pollStatus, POLL_INTERVAL_MS);
  }, [pollStatus]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Iniciar autopilot
  const startAutopilot = useCallback(async () => {
    setLogs([]);
    setScrapedCount(0);
    setSuccessCount(0);
    lastLogCountRef.current = 0;
    setError(null);

    try {
      const api = await createApiClient();
      const result = await api.post('/api/autopilot/start');
      if (result.success) {
        setIsRunning(true);
        startPolling();
        return true;
      } else {
        setError(result.message || 'Error al iniciar el autopilot');
        return false;
      }
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [startPolling]);

  const clearLogs = useCallback(async () => {
    try {
      const api = await createApiClient();
      await api.post('/api/autopilot/clear-logs');
    } catch {}
    setLogs([]);
    setScrapedCount(0);
    setSuccessCount(0);
    lastLogCountRef.current = 0;
  }, []);

  // Arrancar polling si el servidor ya tiene el autopilot corriendo al montar
  useEffect(() => {
    const initCheck = async () => {
      try {
        const api = await createApiClient();
        const data = await api.pollAutopilotStatus();
        if (data?.isRunning) {
          setIsRunning(true);
          if (data.logs) {
            setLogs(data.logs);
            lastLogCountRef.current = data.logs.length;
          }
          startPolling();
        }
      } catch {}
    };
    initCheck();
    return () => stopPolling();
  }, []);

  return { isRunning, logs, scrapedCount, successCount, error, startAutopilot, clearLogs };
};
