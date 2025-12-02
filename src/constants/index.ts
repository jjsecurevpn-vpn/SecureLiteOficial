// Constantes de la aplicación

export const MINIMUM_REQUIRED_VERSION = '4.5.8';
export const DOWNLOAD_URL_APK = 'https://jhservices.com.ar/secure/SecureTunnel_v4.5.8.apk';
export const DOWNLOAD_URL_SITE = 'https://jhservices.com.ar/loja';
export const UPDATE_TITLE = 'Actualización obligatoria';

export const LS_KEYS = {
  user: 'vpn_user',
  pass: 'vpn_pass',
  uuid: 'vpn_uuid',
  auto: 'vpn_auto_on',
  terms: 'vpn_terms_accepted',
} as const;

export const SCREENS = ['home', 'servers', 'menu', 'logs', 'terms', 'account'] as const;

/** Estados de conexión VPN */
export const VPN_STATUS = {
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  AUTH_FAILED: 'AUTH_FAILED',
  NO_NETWORK: 'NO_NETWORK',
  STOPPING: 'STOPPING',
} as const;

/** Duración del toast en milisegundos */
export const TOAST_DURATION_MS = 2500;

/** Intervalo de polling para estado VPN en milisegundos */
export const VPN_POLLING_INTERVAL_MS = 800;

/** Timeout para auto-conexión por servidor en milisegundos */
export const AUTO_CONNECT_TIMEOUT_MS = 10000;

/**
 * Mensajes de la UI - preparado para i18n
 * Centraliza todos los textos para facilitar traducción futura
 */
export const UI_MESSAGES = {
  // Conexión
  connection: {
    cancel: 'Conexión cancelada',
    selectServer: 'Selecciona un servidor',
    enterUuid: 'Ingresa el UUID',
    enterCredentials: 'Ingresa usuario y contraseña',
    stopToChange: 'Detén la conexión para cambiar de servidor',
    serverSelected: 'Servidor seleccionado',
    searchingUpdate: 'Buscando actualización…',
    updateNotAvailable: 'Actualización nativa no disponible',
  },
  // Botones
  buttons: {
    connect: 'CONECTAR',
    disconnect: 'DESCONECTAR',
    stop: 'PARAR',
    update: 'Actualizar',
    logs: 'Registros',
    viewDetails: 'Ver detalles',
    back: 'Volver',
  },
  // Estados
  status: {
    disconnected: 'Estás desconectado',
    connected: 'CONECTADO',
    connecting: 'Estableciendo conexión…',
    connectingTo: (name: string) => `Conectando a ${name}…`,
  },
  // Auto conexión
  auto: {
    testing: (name: string) => `Auto: probando ${name}`,
  },
  // Servidores
  servers: {
    title: 'Servidores',
    noServers: 'Ningún servidor disponible.',
    checkConfigs: 'Verifica si las configs fueron cargadas',
    serverCount: (count: number) => `${count} servidores`,
    backToCategories: 'Volver a categorías',
  },
  // Sesión
  session: {
    active: 'Sesión activa',
    greeting: (name: string) => `Hola, ${name}`,
    protected: 'Tu conexión está protegida. Consulta los datos de tu cuenta cuando lo necesites.',
  },
  // Update
  update: {
    required: 'Actualización obligatoria',
    downloadLatest: 'Descarga la última versión para que la app funcione correctamente.',
  },
} as const;
