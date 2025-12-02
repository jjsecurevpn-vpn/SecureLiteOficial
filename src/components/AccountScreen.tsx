import { memo, useMemo } from 'react';
import { useVpn } from '../context/VpnContext';
import { formatBytes, pingClass } from '../utils/formatUtils';
import { dt } from '../services/vpnBridge';
import { useSectionStyle } from '../hooks';

export const AccountScreen = memo(function AccountScreen() {
  const { status, user, creds, config, pingMs, topInfo } = useVpn();
  const sectionStyle = useSectionStyle();

  const dl = +(dt.call<number>('DtGetNetworkDownloadBytes') || 0);
  const ul = +(dt.call<number>('DtGetNetworkUploadBytes') || 0);
  const used = dl + ul;

  const name = user?.name || config?.auth?.username || creds.user || 'usuario';
  const vence = user?.expiration_date || '-';
  const limite = user?.limit_connections || '-';
  const conexiones = user?.count_connections ?? 0;
  const server = config?.name || 'Sin servidor activo';
  const mode = config?.mode || '—';

  const pNum = typeof pingMs === 'number' ? Math.round(pingMs) : NaN;
  const pCls = pingClass(pNum);
  const pShow = Number.isFinite(pNum) ? `${pNum} ms` : '—';

  const statusCopy =
    status === 'CONNECTED'
      ? 'Conectado'
      : status === 'CONNECTING'
        ? 'Conectando'
        : 'Desconectado';

  const stats = useMemo(
    () => [
      { label: 'Estado', value: statusCopy },
      { label: 'Latencia', value: pShow, className: pCls },
      { label: 'Consumo total', value: formatBytes(used) },
      { label: 'Sesiones activas', value: conexiones.toString() },
    ],
    [statusCopy, pShow, pCls, used, conexiones],
  );

  const compactSections = useMemo(
    () => [
      {
        title: 'Plan',
        items: [
          { label: 'Cliente', value: name },
          { label: 'Vigencia', value: vence },
          { label: 'Dispositivos', value: limite },
        ],
      },
      {
        title: 'Conexión',
        items: [
          { label: 'Servidor', value: server },
          { label: 'Modo', value: mode },
          { label: 'Operadora', value: topInfo.op },
          { label: 'IP pública', value: topInfo.ip },
        ],
      },
      {
        title: 'Credenciales',
        items: [
          { label: 'Usuario', value: creds.user || '—' },
          { label: 'UUID', value: creds.uuid || '—' },
        ],
      },
    ],
    [name, vence, limite, server, mode, topInfo.op, topInfo.ip, creds.user, creds.uuid],
  );

  return (
    <section className="screen account-screen" style={sectionStyle}>
      <div className="account-header">
        <span className="summary-eyebrow">Información de la cuenta</span>
        <h2>Hola, {name}</h2>
        <p className="summary-meta">Gestiona los detalles de tu sesión y plan activo.</p>
      </div>

      <div className="stat-grid">
        {stats.map(({ label, value, className }) => (
          <div key={label} className="stat-card">
            <small>{label}</small>
            <strong className={className}>{value}</strong>
          </div>
        ))}
      </div>

      <div className="account-stack">
        {compactSections.map(({ title, items }) => (
          <div key={title} className="account-card compact">
            <div className="card-head">
              <span>{title}</span>
            </div>
            <ul>
              {items.map(({ label, value }) => (
                <li key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
});
