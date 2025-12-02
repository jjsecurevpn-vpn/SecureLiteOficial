/**
 * Configuración centralizada de la aplicación
 * Valores que pueden cambiar entre ambientes o versiones
 */

export const APP_CONFIG = {
  /** Nombre de la aplicación */
  name: 'Secure Tunnel',
  
  /** Versión actual */
  version: '4.5.8',
  
  /** URLs de descarga */
  urls: {
    apk: 'https://jhservices.com.ar/secure/SecureTunnel_v4.5.8.apk',
    site: 'https://jhservices.com.ar/loja',
  },
  
  /** Timeouts en milisegundos */
  timeouts: {
    /** Duración del toast */
    toast: 2500,
    /** Polling de estado VPN */
    vpnPolling: 800,
    /** Timeout por servidor en auto-connect */
    autoConnect: 10000,
    /** Intervalo de verificación en auto-connect */
    autoConnectCheck: 600,
    /** Cooldown entre intentos de fetch de usuario */
    userFetchCooldown: 5000,
  },
  
  /** Límites de ping para clasificación */
  ping: {
    good: 200,
    warn: 500,
  },
} as const;

/** Tipo para acceder a la configuración de forma tipada */
export type AppConfig = typeof APP_CONFIG;
