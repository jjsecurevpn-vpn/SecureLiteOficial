import { useCallback, useState, useEffect } from 'react';
import { useVpn } from '../features/vpn/model/VpnContext';
import { useToastContext } from '../shared/toast/ToastContext';
import { useConnectionStatus } from '../features/vpn/model/useConnectionStatus';
import { useSectionStyle } from '../shared/hooks/useSectionStyle';
import { UI_MESSAGES } from '../constants';
import { callOne } from '../features/vpn/api/vpnBridge';
import { ServerCard } from '../shared/components/ServerCard';
import { HeaderPromo } from '../shared/components/HeaderPromo';
import { CredentialFields } from '../shared/ui/CredentialFields';
import { Toggle } from '../shared/ui/Toggle';
import { Button } from '../shared/ui/Button';
import { SessionDetails } from '../shared/components/SessionDetails';
import keyboardNavigationManager from '../shared/utils/keyboardNavigationManager';
// Nota: stats en tiempo real se muestran a nivel de categorías (ServersScreen)

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
    autoMode,
    setAutoMode,
  } = useVpn();
  const { showToast } = useToastContext();
  const sectionStyle = useSectionStyle();
  const connectionState = useConnectionStatus();
  const { isDisconnected, isConnecting, isConnected, isError } = connectionState;

  // Determinar qué campos mostrar (mostrar también cuando hay error para permitir corregir credenciales)
  const isV2Ray = (config?.mode || '').toLowerCase().includes('v2ray');
  const isFreeServer = (config?.name || '').toLowerCase().includes('gratuito');
  const hasEmbeddedAuth = isFreeServer || !!(config?.auth?.username || config?.auth?.password || config?.auth?.uuid);
  const canEditCredentials = isDisconnected || isError;
  const showUserPass = !hasEmbeddedAuth && !isV2Ray && canEditCredentials;
  const showUuid = !hasEmbeddedAuth && isV2Ray && canEditCredentials;

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
    setScreen('servers');
  }, [setScreen]);

  const handleUpdate = useCallback(() => {
    if (callOne(['DtStartAppUpdate', 'DtExecuteDialogConfig'])) {
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
      : isError
        ? UI_MESSAGES.buttons.retry
        : UI_MESSAGES.buttons.connect;

  const [logoError, setLogoError] = useState(false);

  // Activar navigation manager automáticamente al primer evento de teclado/remote en Home
  useEffect(() => {
    const onFirstKey = (e: KeyboardEvent) => {
      const keys = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Enter', ' '];
      if (keys.includes(e.key)) {
        if (!keyboardNavigationManager.enabled) {
          keyboardNavigationManager.enable('.home-main', { includeFormControls: true });
        }
      }
    };
    window.addEventListener('keydown', onFirstKey);
    return () => window.removeEventListener('keydown', onFirstKey);
  }, []);

  // Ensure focus returns to the server card when arriving at Home
  useEffect(() => {
    let mounted = true;
    const maxAttempts = 6;
    let attempt = 0;
    const timers: number[] = [];

    const tryFocus = () => {
      if (!mounted) return true;
      try {
        const el = document.querySelector<HTMLElement>('.home-main .location-card');
        if (el) {
          try {
            el.focus();
          } catch {}
          try {
            // ensure manager is enabled for keyboard navigation
            keyboardNavigationManager.enable('.home-main', { includeFormControls: true });
          } catch {}
          return true;
        }
      } catch (err) {
        // ignore
      }
      return false;
    };

    const schedule = () => {
      const ok = tryFocus();
      attempt++;
      if (!ok && attempt < maxAttempts) {
        const t = window.setTimeout(schedule, 40 * attempt);
        timers.push(t);
      }
    };

    timers.push(window.setTimeout(schedule, 20));

    return () => {
      mounted = false;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  return (
    <section className="screen home-screen" style={sectionStyle}>
      <div className="home-main">
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

        <div className="server-card-wrapper">
          <div className="server-card">
            <ServerCard 
              config={config} 
              onClick={handleServerClick}
              disabled={false}
            />

            <HeaderPromo />

            {canEditCredentials && (
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
              <Button variant="primary" onClick={handleConnect} className={isConnected ? 'danger' : ''} data-nav>
                {buttonText}
              </Button>
              <Toggle
                checked={autoMode}
                onChange={setAutoMode}
                label="Auto"
              />
            </div>

            <div className="quick-grid">
              <Button variant="quick" onClick={handleUpdate} data-nav>
                <i className="fa fa-rotate" />Actualizar
              </Button>
              <Button variant="quick" onClick={handleLogs} data-nav>
                <i className="fa fa-terminal" />{UI_MESSAGES.buttons.logs}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
