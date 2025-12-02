import { useCallback, useState } from 'react';
import { useVpn } from '../context/VpnContext';
import { useToastContext } from '../context/ToastContext';
import { useConnectionStatus, useSectionStyle } from '../hooks';
import { UPDATE_TITLE, UI_MESSAGES } from '../constants';
import { callOne } from '../services/vpnBridge';
import { ServerCard } from './ServerCard';
import { CredentialFields } from './ui/CredentialFields';
import { Toggle } from './ui/Toggle';
import { Button } from './ui/Button';
import { SessionDetails } from './SessionDetails';

export function HomeScreen() {
  const {
    config,
    creds,
    setCreds,
    setScreen,
    connect,
    disconnect,
    cancelConnecting,
    startAutoConnect,
    needsUpdate,
    autoMode,
    setAutoMode,
  } = useVpn();
  const { showToast } = useToastContext();
  const sectionStyle = useSectionStyle();
  const { isDisconnected, isConnecting, isConnected } = useConnectionStatus();

  // Determinar qué campos mostrar
  const isV2Ray = (config?.mode || '').toLowerCase().includes('v2ray');
  const isFreeServer = (config?.name || '').toLowerCase().includes('gratuito');
  const hasEmbeddedAuth = isFreeServer || !!(config?.auth?.username || config?.auth?.password || config?.auth?.uuid);
  const showUserPass = !hasEmbeddedAuth && !isV2Ray && isDisconnected;
  const showUuid = !hasEmbeddedAuth && isV2Ray && isDisconnected;

  const handleConnect = useCallback(() => {
    if (isConnected) {
      disconnect();
      return;
    }
    if (isConnecting) {
      cancelConnecting();
      showToast(UI_MESSAGES.connection.cancel);
      return;
    }
    // Validar
    if (!config) {
      showToast(UI_MESSAGES.connection.selectServer);
      return;
    }
    if (!hasEmbeddedAuth) {
      if (isV2Ray && !creds.uuid.trim()) {
        showToast(UI_MESSAGES.connection.enterUuid);
        return;
      }
      if (!isV2Ray && (!creds.user.trim() || !creds.pass.trim())) {
        showToast(UI_MESSAGES.connection.enterCredentials);
        return;
      }
    }
    if (autoMode) {
      startAutoConnect();
    } else {
      connect();
    }
  }, [isConnected, isConnecting, config, hasEmbeddedAuth, isV2Ray, creds, autoMode, disconnect, cancelConnecting, showToast, startAutoConnect, connect]);

  const handleServerClick = useCallback(() => {
    if (!isDisconnected) {
      showToast(UI_MESSAGES.connection.stopToChange);
      return;
    }
    setScreen('servers');
  }, [isDisconnected, showToast, setScreen]);

  const handleUpdate = useCallback(() => {
    if (callOne(['DtStartAppUpdate'])) {
      showToast(UI_MESSAGES.connection.searchingUpdate);
    } else {
      showToast(UI_MESSAGES.connection.updateNotAvailable);
    }
  }, [showToast]);

  const handleLogs = useCallback(() => {
    setScreen('logs');
  }, [setScreen]);

  const buttonText = isConnected 
    ? UI_MESSAGES.buttons.disconnect 
    : isConnecting 
      ? UI_MESSAGES.buttons.stop 
      : UI_MESSAGES.buttons.connect;

  const [logoError, setLogoError] = useState(false);

  return (
    <section className="screen" style={sectionStyle}>
      <div className="logo-container">
        {logoError ? (
          <div className="logo-fallback">
            <span className="logo-icon">🔒</span>
            <span className="logo-text">Secure VPN</span>
          </div>
        ) : (
          <img
            src="https://i.ibb.co/nMHrd6V4/Secure-VPN.png"
            alt="Secure"
            className="logo"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            onError={() => setLogoError(true)}
          />
        )}
      </div>

      <div className="server-card">
        {needsUpdate && (
          <div className="info-card" style={{ marginBottom: 12 }}>
            <strong>{UPDATE_TITLE}</strong>
            <p className="muted" style={{ marginTop: 4 }}>
              Descarga la última versión para que la app funcione correctamente.
            </p>
          </div>
        )}

        <ServerCard 
          config={config} 
          onClick={handleServerClick}
          disabled={!isDisconnected}
        />

        {isDisconnected && (
          <CredentialFields
            username={creds.user}
            password={creds.pass}
            uuid={creds.uuid}
            showUserPass={showUserPass}
            showUuid={showUuid}
            onUsernameChange={(v) => setCreds({ user: v })}
            onPasswordChange={(v) => setCreds({ pass: v })}
            onUuidChange={(v) => setCreds({ uuid: v })}
          />
        )}

        {isConnected && <SessionDetails />}

        <div className="row connect-row">
          <Button variant="primary" onClick={handleConnect}>
            {buttonText}
          </Button>
          <Toggle
            checked={autoMode}
            onChange={setAutoMode}
            label="Auto"
          />
        </div>

        <div className="quick-grid">
          <Button variant="quick" onClick={handleUpdate}>
            <i className="fa fa-rotate" />Actualizar
          </Button>
          <Button variant="quick" onClick={handleLogs}>
            <i className="fa fa-terminal" />Registros
          </Button>
        </div>
      </div>
    </section>
  );
}
