import { createContext, useContext, type ReactNode } from 'react';
import type { VpnContextType } from './types';
import { useVpnController } from '../hooks/vpn/useVpnController';

const VpnContext = createContext<VpnContextType | null>(null);

export function VpnProvider({ children }: { children: ReactNode }) {
  const value = useVpnController();
  return <VpnContext.Provider value={value}>{children}</VpnContext.Provider>;
}

export function useVpn() {
  const ctx = useContext(VpnContext);
  if (!ctx) throw new Error('useVpn must be used within VpnProvider');
  return ctx;
}
