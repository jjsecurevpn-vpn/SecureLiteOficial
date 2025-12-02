/**
 * Tipos para las APIs nativas del bridge DT
 * Proporciona tipado estricto para la comunicación con la app nativa
 */

/** Nombres de APIs disponibles en el bridge */
export type DtApiName = 
  // Conexión VPN
  | 'DtExecuteVpnStart'
  | 'DtExecuteVpnStop'
  | 'DtGetVpnState'
  | 'DtSetConfig'
  | 'DtGetConfigs'
  | 'DtGetDefaultConfig'
  // Credenciales
  | 'DtUsername'
  | 'DtPassword'
  | 'DtUuid'
  // Info de red
  | 'DtGetNetworkName'
  | 'DtGetLocalIP'
  | 'DtGetPingResult'
  | 'DtGetNetworkDownloadBytes'
  | 'DtGetNetworkUploadBytes'
  // Versiones
  | 'DtAppVersion'
  | 'DtGetLocalConfigVersion'
  // Acciones del sistema
  | 'DtStartAppUpdate'
  | 'DtStartApnActivity'
  | 'DtOpenApn'
  | 'DtApn'
  | 'DtIgnoreBatteryOptimizations'
  | 'DtOpenBatteryOptimization'
  | 'DtOpenPower'
  | 'DtStartHotSpotService'
  | 'DtStopHotSpotService'
  | 'DtGetStatusHotSpotService'
  | 'DtStartWebViewActivity'
  | 'DtOpenExternalUrl'
  | 'DtCleanApp'
  // Logs
  | 'DtGetLogs'
  | 'DtClearLogs'
  // Usuario
  | 'DtGetUserData'
  | 'DtRequestUserData'
  // Genérico para APIs no listadas
  | (string & {});

/** Eventos nativos disponibles */
export type DtEventName =
  | 'DtVpnStateEvent'
  | 'DtConfigSelectedEvent'
  | 'DtNewDefaultConfigEvent'
  | 'DtUserDataEvent'
  | 'DtPingEvent'
  | (string & {});

/** Estados de VPN devueltos por el bridge */
export type NativeVpnState = 
  | 'DISCONNECTED' 
  | 'CONNECTING' 
  | 'CONNECTED' 
  | 'AUTH_FAILED' 
  | 'NO_NETWORK' 
  | 'STOPPING';

/** Estados del hotspot */
export type HotspotState = 'RUNNING' | 'STOPPED' | 'UNKNOWN';

/** Interfaz del bridge nativo */
export interface NativeBridge {
  call<T = unknown>(name: DtApiName, ...args: unknown[]): T | null;
  set(name: DtApiName, value: unknown): void;
  readonly jsonConfigAtual: Record<string, unknown> | null;
}
