import { memo, useCallback } from 'react';
import { useVpn } from '../context/VpnContext';
import { Button } from './ui/Button';
import { UI_MESSAGES } from '../constants';

/**
 * Muestra información de la sesión cuando está conectado
 * Anteriormente llamado "ConnectedInfo"
 */
export const SessionDetails = memo(function SessionDetails() {
  const { status, user, creds, config, setScreen } = useVpn();

  const handleViewDetails = useCallback(() => {
    setScreen('account');
  }, [setScreen]);

  if (status !== 'CONNECTED') return null;

  const name = user?.name || config?.auth?.username || creds.user || 'usuario';

  return (
    <div className="info-card session-card">
      <div className="session-card__body">
        <span className="summary-eyebrow">{UI_MESSAGES.session.active}</span>
        <p className="session-card__title">{UI_MESSAGES.session.greeting(name)}</p>
        <p className="session-card__meta">{UI_MESSAGES.session.protected}</p>
      </div>
      <Button
        variant="soft"
        className="session-card__button"
        onClick={handleViewDetails}
      >
        <i className="fa fa-user-shield" aria-hidden="true" /> {UI_MESSAGES.buttons.viewDetails}
      </Button>
    </div>
  );
});

/** @deprecated Usar SessionDetails */
export { SessionDetails as ConnectedInfo };
