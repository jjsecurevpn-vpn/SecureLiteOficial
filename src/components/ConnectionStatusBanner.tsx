import { memo } from 'react';
import { useVpn } from '../context/VpnContext';
import { UI_MESSAGES } from '../constants';

/**
 * Muestra el estado de conexión VPN con icono y texto
 * Anteriormente llamado "Hero"
 */
export const ConnectionStatusBanner = memo(function ConnectionStatusBanner() {
  const { status, config } = useVpn();

  let iconClass = 'fa fa-lock-open';
  let iconState: 'connected' | 'default' = 'default';
  let text: string = UI_MESSAGES.status.disconnected;

  if (status === 'CONNECTED') {
    iconClass = 'fa fa-lock';
    iconState = 'connected';
    text = UI_MESSAGES.status.connected;
  } else if (status === 'CONNECTING') {
    iconClass = 'fa fa-spinner fa-spin';
    text = config?.name ? UI_MESSAGES.status.connectingTo(config.name) : UI_MESSAGES.status.connecting;
  }

  return (
    <div className="hero">
      <i className={`${iconClass} ${iconState === 'connected' ? 'hero-lock--connected' : ''}`.trim()} />
      <div className="title">{text}</div>
    </div>
  );
});

/** @deprecated Usar ConnectionStatusBanner */
export { ConnectionStatusBanner as Hero };
