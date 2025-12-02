import { useCallback, useRef } from 'react';
import type { AutoState, Category, Credentials, ScreenType, ServerConfig, VpnStatus } from '../../types';
import { AUTO_CONNECT_TIMEOUT_MS } from '../../constants';
import { dt } from '../../services/vpnBridge';

interface UseAutoConnectArgs {
  status: VpnStatus;
  categorias: Category[];
  creds: Credentials;
  setStatus: (status: VpnStatus) => void;
  setConfigState: (config: ServerConfig) => void;
  setScreen: (screen: ScreenType) => void;
  persistCreds: () => void;
  pushCreds: () => void;
}

/**
 * Hook para manejar la lógica de auto-conexión rotativa
 */
export function useAutoConnect({
  status,
  categorias,
  setStatus,
  setConfigState,
  setScreen,
  persistCreds,
  pushCreds,
}: UseAutoConnectArgs) {
  const autoRef = useRef<AutoState>({ on: false, tmo: null, ver: null, list: [], i: 0 });

  const clearAutoTimers = useCallback(() => {
    if (autoRef.current.tmo) clearTimeout(autoRef.current.tmo);
    if (autoRef.current.ver) clearInterval(autoRef.current.ver);
    autoRef.current.tmo = null;
    autoRef.current.ver = null;
  }, []);

  const nextAuto = useCallback(() => {
    const auto = autoRef.current;
    if (!auto.on) return;
    
    if (auto.i >= auto.list.length) {
      auto.on = false;
      setStatus('DISCONNECTED');
      return;
    }
    
    const srv = auto.list[auto.i++];
    dt.call('DtSetConfig', srv.id);
    setConfigState(srv);
    
    setTimeout(() => {
      pushCreds();
      dt.call('DtExecuteVpnStart');
    }, 120);

    clearAutoTimers();
    
    // Timeout para probar siguiente servidor
    auto.tmo = setTimeout(() => {
      dt.call('DtExecuteVpnStop');
      setTimeout(nextAuto, 350);
    }, AUTO_CONNECT_TIMEOUT_MS);

    // Verificación periódica del estado
    auto.ver = setInterval(() => {
      const st = dt.call<string>('DtGetVpnState') || 'DISCONNECTED';
      if (!auto.on) {
        clearAutoTimers();
        return;
      }
      if (st === 'CONNECTED') {
        clearAutoTimers();
        setStatus('CONNECTED');
        auto.on = false;
      } else if (['AUTH_FAILED', 'NO_NETWORK', 'STOPPING'].includes(st)) {
        clearAutoTimers();
        dt.call('DtExecuteVpnStop');
        setTimeout(nextAuto, 350);
      }
    }, 600);
  }, [clearAutoTimers, pushCreds, setConfigState, setStatus]);

  const startAutoConnect = useCallback((cat?: Category) => {
    if (status === 'CONNECTED' || status === 'CONNECTING') return;

    pushCreds();
    persistCreds();
    clearAutoTimers();

    let list: ServerConfig[] = [];
    if (cat?.items?.length) {
      list = cat.items.slice();
    } else {
      categorias.forEach(c => c.items && list.push(...c.items));
    }

    if (!list.length) return;

    autoRef.current.on = true;
    autoRef.current.list = list;
    autoRef.current.i = 0;
    setStatus('CONNECTING');
    setScreen('home');
    nextAuto();
  }, [categorias, clearAutoTimers, nextAuto, persistCreds, pushCreds, setScreen, setStatus, status]);

  const cancelAuto = useCallback(() => {
    autoRef.current.on = false;
    clearAutoTimers();
  }, [clearAutoTimers]);

  return {
    auto: autoRef.current,
    startAutoConnect,
    cancelAuto,
    clearAutoTimers,
  };
}
