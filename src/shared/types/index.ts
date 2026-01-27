// Tipos para la aplicación Secure Tunnel

import { SCREENS } from '../../constants';

interface ServerAuth {
  username?: string;
  password?: string;
  uuid?: string;
}

export interface ServerConfig {
  id: string;
  name: string;
  description?: string;
  mode: string;
  ip?: string;
  icon?: string;
  auth?: ServerAuth;
  sorter?: number;
}

export interface Category {
  name: string;
  items: ServerConfig[];
  sorter?: number;
}

export interface UserInfo {
  name: string;
  expiration_date: string;
  limit_connections: string;
  count_connections: number;
}

export interface Credentials {
  user: string;
  pass: string;
  uuid: string;
}

/**
 * Estado del modo auto-conexión
 * Maneja la rotación automática entre servidores
 */
export interface AutoState {
  /** Indica si el modo auto está activo */
  on: boolean;
  /** Timeout para cambiar de servidor si no conecta (tmo = timeout) */
  tmo: ReturnType<typeof setTimeout> | null;
  /** Intervalo para verificar estado de conexión (ver = verification) */
  ver: ReturnType<typeof setInterval> | null;
  /** Lista de servidores a probar */
  list: ServerConfig[];
  /** Índice actual en la cola de servidores */
  i: number;
}

export type VpnStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'AUTH_FAILED' | 'NO_NETWORK' | 'STOPPING';

export type ScreenType = (typeof SCREENS)[number];

export interface ServerRealtimeStat {
  serverId: number;
  serverName: string;
  location?: string;
  status?: 'online' | 'offline' | string;
  connectedUsers: number;
  cpuUsage?: number;
  memoryUsage?: number;
  cpuCores?: number;
  totalMemoryGb?: number;
  totalUsuarios?: number;
  lastUpdate?: string;
  netRecvMbps?: number;
  netSentMbps?: number;
}

export interface ServersStatsResponse {
  fetchedAt: string;
  totalUsers: number;
  onlineServers: number;
  servers: ServerRealtimeStat[];
}

// Nota: se importan tipos nativos desde './native' directamente cuando se necesitan.
