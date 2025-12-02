import { useState, useEffect, useCallback } from 'react';
import { getLogs, parseLogs } from '../services/vpnBridge';

export function useLogs() {
  const [logs, setLogs] = useState('Carregando logs...');
  const [isPolling, setIsPolling] = useState(false);

  const refresh = useCallback(() => {
    const raw = getLogs();
    const text = parseLogs(raw);
    const lines = text.split('\n');
    setLogs(lines.length > 60 ? lines.slice(-60).join('\n') : text || '…');
  }, []);

  const startPolling = useCallback(() => {
    setIsPolling(true);
  }, []);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  useEffect(() => {
    if (!isPolling) return;
    refresh();
    const interval = setInterval(refresh, 700);
    return () => clearInterval(interval);
  }, [isPolling, refresh]);

  return { logs, refresh, startPolling, stopPolling, isPolling };
}
