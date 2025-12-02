import { useMemo } from 'react';
import { useVpn } from '../context/VpnContext';

export interface ConnectionStatus {
  /** Está desconectado y no hay auto-conexión activa */
  isDisconnected: boolean;
  /** Está conectando o hay auto-conexión activa */
  isConnecting: boolean;
  /** Está conectado */
  isConnected: boolean;
  /** Estado raw del VPN */
  status: string;
}

/**
 * Hook que centraliza la lógica de estados de conexión
 * Evita duplicar la lógica en múltiples componentes
 */
export function useConnectionStatus(): ConnectionStatus {
  const { status, auto } = useVpn();

  return useMemo(() => ({
    isDisconnected: status === 'DISCONNECTED' && !auto.on,
    isConnecting: status === 'CONNECTING' || auto.on,
    isConnected: status === 'CONNECTED',
    status,
  }), [status, auto.on]);
}
