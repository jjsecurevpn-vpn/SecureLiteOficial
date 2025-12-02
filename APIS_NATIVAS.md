# DTunnel - Documentación de la API Nativa

Documentación completa de la API JavaScript para los hooks nativos del sistema DTunnel, disponible a través de `window.Dt*`.

> ⚠️ **Importante:** Todos los métodos deben ser llamados desde JavaScript en el contexto del WebView de la aplicación Android.

---

## 📑 Índice

1. [Configuración de Servidores](#1-configuración-de-servidores)
2. [Control de VPN](#2-control-de-vpn)
3. [Credenciales de Usuario](#3-credenciales-de-usuario)
4. [Verificación de Usuario](#4-verificación-de-usuario)
5. [Información de Red](#5-información-de-red)
6. [Estadísticas de Tráfico](#6-estadísticas-de-tráfico)
7. [Logs del Sistema](#7-logs-del-sistema)
8. [Información del Dispositivo](#8-información-del-dispositivo)
9. [HotSpot / Tethering](#9-hotspot--tethering)
10. [Modo Avión](#10-modo-avión)
11. [URLs y WebViews](#11-urls-y-webviews)
12. [Interfaz Nativa](#12-interfaz-nativa)
13. [Utilidades](#13-utilidades)
14. [Eventos del Sistema](#14-eventos-del-sistema)

---

## 1. Configuración de Servidores

### `DtGetConfigs.execute(): Category[]`

Obtiene todas las categorías de servidores disponibles.

```js
const categorias = window.DtGetConfigs.execute();
// Retorna: Array de categorías con servidores
```

**Estructura de retorno:**
```typescript
interface Category {
  id: number;
  name: string;
  sorter: number;
  color?: string;
  items: ServerConfig[];
}

interface ServerConfig {
  id: number;
  name: string;
  description?: string;
  mode: 'SSH_PROXY' | 'V2RAY' | 'SSH_DIRECT' | string;
  sorter: number;
  icon?: string;
  auth?: {
    username?: string;
    password?: string;
    uuid?: string;
    v2ray_uuid?: string;
  };
}
```

### `DtSetConfig.execute(id: number): void`

Define el servidor activo por su ID.

```js
window.DtSetConfig.execute(695925);
```

### `DtGetDefaultConfig.execute(): ServerConfig | null`

Obtiene el servidor actualmente seleccionado.

```js
const servidor = window.DtGetDefaultConfig.execute();
if (servidor) {
  console.log('Servidor activo:', servidor.name);
}
```

---

## 2. Control de VPN

### `DtGetVpnState.execute(): VpnState`

Obtiene el estado actual de la conexión VPN.

```js
const estado = window.DtGetVpnState.execute();
```

**Estados posibles:**
| Estado | Descripción |
|--------|-------------|
| `'DISCONNECTED'` | Sin conexión |
| `'CONNECTING'` | Estableciendo conexión |
| `'CONNECTED'` | Conectado exitosamente |
| `'STOPPING'` | Deteniendo conexión |
| `'AUTH'` | Autenticando |
| `'AUTH_FAILED'` | Falló la autenticación |
| `'NO_NETWORK'` | Sin red disponible |

### `DtExecuteVpnStart.execute(): void`

Inicia la conexión VPN con el servidor configurado.

```js
window.DtExecuteVpnStart.execute();
```

### `DtExecuteVpnStop.execute(): void`

Detiene la conexión VPN activa.

```js
window.DtExecuteVpnStop.execute();
```

---

## 3. Credenciales de Usuario

### `DtUsername`

Gestiona el nombre de usuario para autenticación.

```js
// Obtener
const user = window.DtUsername.get();

// Establecer
window.DtUsername.set('mi_usuario');
```

### `DtPassword`

Gestiona la contraseña para autenticación.

```js
// Obtener
const pass = window.DtPassword.get();

// Establecer
window.DtPassword.set('mi_contraseña');
```

### `DtUuid`

Gestiona el UUID para conexiones V2Ray.

```js
// Obtener
const uuid = window.DtUuid.get();

// Establecer
window.DtUuid.set('6897ee2e-a49f-4d5d-b169-cd497d7b8cd9');
```

---

## 4. Verificación de Usuario

### `DtStartCheckUser.execute(): void`

Inicia el proceso de verificación del usuario. Los resultados se reciben a través del evento `DtCheckUserResultEvent`.

```js
window.DtStartCheckUser.execute();

// Escuchar resultado
window.DtCheckUserResultEvent = function(data) {
  console.log('Vencimiento:', data.expiration_date);
  console.log('Límite conexiones:', data.limit_connections);
  console.log('Conexiones activas:', data.count_connections);
};
```

**Payload del evento `DtCheckUserResultEvent`:**
```json
{
  "expiration_days": "983",
  "limit_connections": "09",
  "expiration_date": "02/03/2028",
  "username": "094d26d6-fe52-42f6-bfac-ef99dcdd3e50",
  "count_connections": "01"
}
```

> ⚠️ **Nota:** El campo `username` en el payload es el identificador interno (UUID), no el nombre legible del usuario.

---

## 5. Información de Red

### `DtGetLocalIP.execute(): string`

Obtiene la IP local del dispositivo.

```js
const ip = window.DtGetLocalIP.execute();
// Ej: '192.168.1.100'
```

### `DtGetNetworkName.execute(): string`

Obtiene el nombre/tipo de la red actual.

```js
const red = window.DtGetNetworkName.execute();
// Ej: 'WIFI', 'MOBILE', 'CLARO', 'VIVO'
```

### `DtGetPingResult.execute(): number`

Obtiene la latencia actual en milisegundos.

```js
const ping = window.DtGetPingResult.execute();
// Ej: 45
```

### `DtGetNetworkData.execute(): NetworkInfo`

Obtiene información detallada de la conexión de red.

```js
const info = window.DtGetNetworkData.execute();
```

**Estructura de retorno:**
```typescript
interface NetworkInfo {
  type_name: 'MOBILE' | 'WIFI';
  type: number;
  extra_info: string;
  detailed_state: string;
  reason?: string;
}
```

---

## 6. Estadísticas de Tráfico

### `DtGetNetworkDownloadBytes.execute(): number`

Total de bytes descargados en la sesión.

```js
const download = window.DtGetNetworkDownloadBytes.execute();
```

### `DtGetNetworkUploadBytes.execute(): number`

Total de bytes subidos en la sesión.

```js
const upload = window.DtGetNetworkUploadBytes.execute();
```

**Ejemplo de uso:**
```js
function formatBytes(bytes) {
  const KB = 1024, MB = KB * 1024, GB = MB * 1024;
  if (bytes >= GB) return (bytes / GB).toFixed(2) + ' GB';
  if (bytes >= MB) return (bytes / MB).toFixed(2) + ' MB';
  if (bytes >= KB) return (bytes / KB).toFixed(2) + ' KB';
  return bytes + ' B';
}

const dl = window.DtGetNetworkDownloadBytes.execute();
const ul = window.DtGetNetworkUploadBytes.execute();
console.log('Descarga:', formatBytes(dl));
console.log('Subida:', formatBytes(ul));
```

---

## 7. Logs del Sistema

### `DtGetLogs.execute(): string`

Obtiene todos los logs del sistema en formato JSON.

```js
const logsJson = window.DtGetLogs.execute();
const logs = JSON.parse(logsJson);
// Array de objetos: [{ "timestamp": "mensaje" }, ...]
```

### `DtClearLogs.execute(): void`

Limpia todos los logs del sistema.

```js
window.DtClearLogs.execute();
```

---

## 8. Información del Dispositivo

### `DtAppVersion.execute(): string`

Versión actual de la aplicación.

```js
const version = window.DtAppVersion.execute();
// Ej: '4.5.8'
```

### `DtGetLocalConfigVersion.execute(): string`

Versión de la configuración local.

```js
const configVersion = window.DtGetLocalConfigVersion.execute();
// Ej: '1.2.3'
```

### `DtGetDeviceID.execute(): string`

Identificador único del dispositivo.

```js
const deviceId = window.DtGetDeviceID.execute();
```

### `DtGetStatusBarHeight.execute(): number`

Altura de la barra de estado en píxeles.

```js
const altura = window.DtGetStatusBarHeight.execute();
```

### `DtGetNavigationBarHeight.execute(): number`

Altura de la barra de navegación en píxeles.

```js
const altura = window.DtGetNavigationBarHeight.execute();
```

---

## 9. HotSpot / Tethering

### `DtGetStatusHotSpotService.execute(): 'STOPPED' | 'RUNNING'`

Estado del servicio HotSpot.

```js
const estado = window.DtGetStatusHotSpotService.execute();
```

### `DtStartHotSpotService.execute(): void`

Inicia el servicio HotSpot.

```js
window.DtStartHotSpotService.execute();
```

### `DtStopHotSpotService.execute(): void`

Detiene el servicio HotSpot.

```js
window.DtStopHotSpotService.execute();
```

---

## 10. Modo Avión

### `DtAirplaneState.execute(): 'ACTIVE' | 'INACTIVE'`

Estado del modo avión.

```js
const estado = window.DtAirplaneState.execute();
```

### `DtAirplaneActivate.execute(): void`

Activa el modo avión.

```js
window.DtAirplaneActivate.execute();
```

### `DtAirplaneDeactivate.execute(): void`

Desactiva el modo avión.

```js
window.DtAirplaneDeactivate.execute();
```

---

## 11. URLs y WebViews

### `DtStartWebViewActivity.execute(url: string): void`

Abre una URL en un WebView interno de la aplicación.

```js
window.DtStartWebViewActivity.execute('https://speedtest.net');
```

### `DtOpenExternalUrl.execute(url: string): void`

Abre una URL en el navegador predeterminado del sistema.

```js
window.DtOpenExternalUrl.execute('https://ejemplo.com');
```

---

## 12. Interfaz Nativa

### `DtExecuteDialogConfig.execute(): void`

Abre el diálogo nativo de configuraciones.

### `DtShowLoggerDialog.execute(): void`

Abre el diálogo nativo de logs.

### `DtShowMenuDialog.execute(): void`

Abre el menú nativo de herramientas.

### `DtStartAppUpdate.execute(): void`

Inicia el proceso de actualización de la aplicación.

```js
window.DtStartAppUpdate.execute();
```

---

## 13. Utilidades

### `DtTranslateText.execute(key: string): string`

Traduce una clave de texto al idioma configurado.

```js
const texto = window.DtTranslateText.execute('LBL_START');
```

### `DtCleanApp.execute(): void`

Limpia cache y ajustes de la aplicación.

```js
window.DtCleanApp.execute();
```

### `DtAcceptTerms.execute(): void`

Registra la aceptación de términos de uso.

```js
window.DtAcceptTerms.execute();
```

### APIs de APN (Punto de Acceso)

```js
// Cualquiera de estas puede estar disponible
window.DtStartApnActivity.execute();
window.DtOpenApn.execute();
window.DtApn.execute();
```

### APIs de Batería

```js
// Cualquiera de estas puede estar disponible
window.DtIgnoreBatteryOptimizations.execute();
window.DtOpenBatteryOptimization.execute();
window.DtOpenPower.execute();
```

---

## 14. Eventos del Sistema

El sistema DTunnel emite eventos JavaScript que pueden ser capturados definiendo funciones globales en `window`.

### Cómo escuchar eventos

```js
window.DtVpnStateEvent = function(state) {
  console.log('Nuevo estado VPN:', state);
};
```

### Lista de Eventos

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `DtVpnStateEvent` | `string` | Cambio de estado de la VPN |
| `DtVpnStartedSuccessEvent` | `undefined` | VPN iniciada exitosamente |
| `DtVpnStoppedSuccessEvent` | `undefined` | VPN detenida exitosamente |
| `DtCheckUserStartedEvent` | `undefined` | Verificación de usuario iniciada |
| `DtCheckUserResultEvent` | `object` | Resultado de verificación de usuario |
| `DtConfigSelectedEvent` | `ServerConfig` | Nueva configuración seleccionada |
| `DtNewDefaultConfigEvent` | `undefined` | Configuración por defecto cambiada |
| `DtNewLogEvent` | `undefined` | Nuevo log registrado |
| `DtErrorToastEvent` | `string?` | Error para mostrar en toast |
| `DtSuccessToastEvent` | `string?` | Éxito para mostrar en toast |
| `DtMessageErrorEvent` | `undefined` | Error genérico del sistema |

### Ejemplos de Payloads

#### `DtCheckUserResultEvent`
```json
{
  "expiration_days": "983",
  "limit_connections": "09",
  "expiration_date": "02/03/2028",
  "username": "094d26d6-fe52-42f6-bfac-ef99dcdd3e50",
  "count_connections": "01"
}
```

#### `DtVpnStateEvent` - Valores posibles
- `'DISCONNECTED'`
- `'CONNECTING'`
- `'CONNECTED'`
- `'STOPPING'`
- `'AUTH'`
- `'AUTH_FAILED'`

#### `DtConfigSelectedEvent` - Ejemplo V2Ray
```json
{
  "id": 695925,
  "name": "✅ CLARO V2RAY [1]",
  "description": "claro pré/planos",
  "mode": "V2RAY",
  "sorter": 5,
  "icon": "https://example.com/icon.png",
  "auth": {
    "v2ray_uuid": "6897ee2e-a49f-4d5d-b169-cd497d7b8cd9"
  },
  "url_check_user": "https://bot.sshtproject.com"
}
```

#### `DtConfigSelectedEvent` - Ejemplo SSH
```json
{
  "id": 696010,
  "name": "VIVO CLOUDFLARE [6]",
  "description": "Vivo Easy Prime → Vivo Controle",
  "mode": "SSH_PROXY",
  "sorter": 6,
  "icon": "https://example.com/icon.png"
}
```

---

## 🔧 Patrón de Uso Recomendado

### Wrapper para llamadas seguras

```js
const dt = {
  call(name, ...args) {
    try {
      const api = window[name];
      if (!api) return null;
      if (typeof api === 'function') return api(...args);
      if (typeof api.execute === 'function') return api.execute(...args);
    } catch (e) {
      console.error('Error en API:', name, e);
    }
    return null;
  },
  
  set(name, value) {
    try {
      const api = window[name];
      if (!api) return;
      if (typeof api.set === 'function') api.set(value);
      else if (typeof api.execute === 'function') api.execute(value);
    } catch (e) {
      console.error('Error en API:', name, e);
    }
  }
};

// Uso
dt.call('DtExecuteVpnStart');
dt.set('DtUsername', 'mi_usuario');
const estado = dt.call('DtGetVpnState');
```

---

*Última actualización: Noviembre 2025*
