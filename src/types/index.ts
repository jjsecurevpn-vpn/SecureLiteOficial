// Tipos para la aplicación Secure Tunnel

export interface ServerAuth {
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

type ScreenTuple = typeof import('../constants')['SCREENS'];
export type ScreenType = ScreenTuple[number];

export interface AppState {
  status: VpnStatus;
  categorias: Category[];
  config: ServerConfig | null;
  auto: AutoState;
  creds: Credentials;
  user: UserInfo | null;
}

// Re-exportar tipos nativos
export type { DtApiName, DtEventName, NativeVpnState, HotspotState, NativeBridge } from './native';
