import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  AutoState,
  Category,
  Credentials,
  ScreenType,
  ServerConfig,
  VpnStatus,
} from '../../types';
import { MINIMUM_REQUIRED_VERSION } from '../../constants';
import { compareVersions } from '../../utils/formatUtils';
import { dt } from '../../services/vpnBridge';
import { useServers } from './useServers';
import { useVpnEvents } from './useVpnEvents';
import { useAutoConnect } from './useAutoConnect';

interface UseVpnConnectionArgs {
  creds: Credentials;
  persistCreds: () => void;
  setScreen: (screen: ScreenType) => void;
}

export interface UseVpnConnectionState {
  status: VpnStatus;
  config: ServerConfig | null;
  categorias: Category[];
  auto: AutoState;
  needsUpdate: boolean;
  setConfig: (config: ServerConfig) => void;
  connect: () => void;
  disconnect: () => void;
  cancelConnecting: () => void;
  startAutoConnect: (cat?: Category) => void;
  loadCategorias: () => void;
}

export function useVpnConnectionState({ creds, persistCreds, setScreen }: UseVpnConnectionArgs): UseVpnConnectionState {
  const [status, setStatus] = useState<VpnStatus>('DISCONNECTED');
  
  // Hook para manejo de servidores
  const { 
    categorias, 
    config, 
    setConfig, 
    setConfigState, 
    loadCategorias, 
    loadInitialConfig 
  } = useServers();

  // Verificar si necesita actualización
  const needsUpdate = useMemo(() => {
    const currentVersion = dt.call<string>('DtAppVersion') || '0.0.0';
    return compareVersions(currentVersion, MINIMUM_REQUIRED_VERSION) < 0;
  }, []);

  // Función para enviar credenciales al bridge
  const pushCreds = useCallback(() => {
    dt.set('DtUsername', creds.user);
    dt.set('DtPassword', creds.pass);
    dt.set('DtUuid', creds.uuid);
  }, [creds.pass, creds.user, creds.uuid]);

  // Hook para auto-conexión
  const { 
    auto, 
    startAutoConnect, 
    cancelAuto,
  } = useAutoConnect({
    status,
    categorias,
    creds,
    setStatus,
    setConfigState,
    setScreen,
    persistCreds,
    pushCreds,
  });

  // Hook para eventos nativos
  useVpnEvents({
    setStatus,
    setConfigState,
    loadCategorias,
  });

  // Conexión manual
  const connect = useCallback(() => {
    if (!config) return;
    pushCreds();
    persistCreds();
    dt.call('DtSetConfig', config.id);
    dt.call('DtExecuteVpnStart');
    setStatus('CONNECTING');
  }, [config, persistCreds, pushCreds]);

  // Desconexión
  const disconnect = useCallback(() => {
    cancelAuto();
    dt.call('DtExecuteVpnStop');
    setStatus('DISCONNECTED');
  }, [cancelAuto]);

  // Cancelar conexión en progreso
  const cancelConnecting = useCallback(() => {
    cancelAuto();
    dt.call('DtExecuteVpnStop');
    setStatus('DISCONNECTED');
  }, [cancelAuto]);

  // Inicialización
  useEffect(() => {
    loadCategorias();
    loadInitialConfig();
    pushCreds();
  }, [loadCategorias, loadInitialConfig, pushCreds]);

  return {
    status,
    config,
    categorias,
    auto,
    needsUpdate,
    setConfig,
    connect,
    disconnect,
    cancelConnecting,
    startAutoConnect,
    loadCategorias,
  };
}

