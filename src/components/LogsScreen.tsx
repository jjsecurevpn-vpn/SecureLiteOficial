import { memo, useEffect, useCallback, useMemo } from 'react';
import { useVpn } from '../context/VpnContext';
import { useToastContext } from '../context/ToastContext';
import { Button } from './ui/Button';
import { useLogs, useSectionStyle } from '../hooks';
import { callOne } from '../services/vpnBridge';

export const LogsScreen = memo(function LogsScreen() {
  const { setScreen } = useVpn();
  const { showToast } = useToastContext();
  const { logs, refresh } = useLogs();
  const sectionStyle = useSectionStyle();

  const logEntries = useMemo(() => {
    return logs
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        const [maybeMeta, ...rest] = line.split(' - ');
        const meta = rest.length ? maybeMeta : null;
        const message = rest.length ? rest.join(' - ').trim() : line;
        return {
          id: `${index}-${line}`,
          meta,
          message,
        };
      });
  }, [logs]);
  const hasLogs = logEntries.length > 0;

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(logs);
      showToast('Logs copiados');
    } catch {
      showToast('No fue posible copiar');
    }
  }, [logs, showToast]);

  const handleClear = useCallback(() => {
    if (callOne(['DtClearLogs'])) {
      showToast('Logs limpiados');
      refresh();
    }
  }, [showToast, refresh]);

  const handleClose = useCallback(() => {
    setScreen('home');
  }, [setScreen]);

  return (
    <section className="screen" style={sectionStyle}>
      <div className="logs-header">
        <div>
          <div className="panel-title">Registros</div>
          <p className="section-subtitle">Últimos eventos de la app y del puente VPN.</p>
        </div>
        <div className="logs-actions">
          <Button variant="soft" onClick={handleCopy} disabled={!hasLogs}>Copiar</Button>
          <Button variant="soft" onClick={handleClear} disabled={!hasLogs}>Limpiar</Button>
          <Button onClick={handleClose}>Cerrar</Button>
        </div>
      </div>

      <div className="logs-panel">
        {hasLogs ? (
          <div className="logs-list">
            {logEntries.map((entry, idx) => (
              <div key={entry.id} className="log-entry">
                <span className="log-line-number">#{logEntries.length - idx}</span>
                <div className="log-entry__body">
                  {entry.meta && <span className="log-entry__meta">{entry.meta}</span>}
                  <p className="log-entry__text">{entry.message}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-result logs-empty">
            <i className="fas fa-info-circle" aria-hidden="true" />
            <p>No hay registros para mostrar.</p>
            <small className="muted">Realiza una conexión para generar nuevos eventos.</small>
          </div>
        )}
      </div>
    </section>
  );
});
