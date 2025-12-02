import { useEffect } from 'react';
import type { ServerConfig, VpnStatus } from '../../types';
import { dt, onNativeEvent } from '../../services/vpnBridge';
import { VPN_POLLING_INTERVAL_MS } from '../../constants';

interface UseVpnEventsArgs {
  setStatus: (status: VpnStatus) => void;
  setConfigState: (config: ServerConfig) => void;
  loadCategorias: () => void;
}

/**
 * Hook para suscribirse a eventos nativos de VPN
 */
export function useVpnEvents({ setStatus, setConfigState, loadCategorias }: UseVpnEventsArgs) {
  // Suscripción a eventos nativos
  useEffect(() => {
    const offVpn = onNativeEvent('DtVpnStateEvent', state => {
      const st = (typeof state === 'string' ? state : String(state || 'DISCONNECTED')) as VpnStatus;
      setStatus(st);
    });

    const offConfigSelected = onNativeEvent('DtConfigSelectedEvent', payload => {
      try {
        if (!payload) return;
        const cfg = (typeof payload === 'string' ? JSON.parse(payload) : payload) as ServerConfig;
        setConfigState(cfg);
      } catch (error) {
        console.error('❌ Error parsing config payload:', error);
      }
    });

    const offNewDefault = onNativeEvent('DtNewDefaultConfigEvent', () => {
      loadCategorias();
    });

    return () => {
      offVpn();
      offConfigSelected();
      offNewDefault();
    };
  }, [setStatus, setConfigState, loadCategorias]);

  // Polling de estado VPN como fallback
  useEffect(() => {
    const interval = setInterval(() => {
      const st = dt.call<string>('DtGetVpnState') as VpnStatus | null;
      if (st) {
        setStatus(st);
      }
    }, VPN_POLLING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [setStatus]);
}
