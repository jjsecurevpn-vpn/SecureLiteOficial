# 📱 API de Estadísticas de Servidores para App VPN

## Información del Backend

La app VPN debe consultar a **nuestro backend** (que actúa como proxy de Servex):

```
Base URL: https://shop.jhservices.com.ar/api
```

---

## 🔓 Autenticación

**NO SE REQUIERE AUTENTICACIÓN** - Los endpoints son públicos.

- Sin API Key
- Sin headers especiales
- Sin cookies/login

---

## 📡 Endpoints Disponibles

### 1️⃣ Snapshot (Recomendado para inicio)

```
GET https://shop.jhservices.com.ar/api/realtime/snapshot
```

**Descripción:** Obtiene el estado actual de todos los servidores en una sola llamada.

**Headers:** Ninguno requerido

**Response:**
```json
{
  "success": true,
  "data": {
    "serverStats": {
      "fetchedAt": "2025-12-30T18:30:00.000Z",
      "totalUsers": 511,
      "onlineServers": 4,
      "servers": [
        {
          "serverId": 515,
          "serverName": "PREMIUM 1 BR",
          "location": "Brasil",
          "status": "online",
          "connectedUsers": 42,
          "cpuUsage": 35.5,
          "memoryUsage": 60.2,
          "cpuCores": 4,
          "totalMemoryGb": 8,
          "totalUsuarios": 200,
          "lastUpdate": "2025-12-30T18:30:00.000Z"
        },
        {
          "serverId": 550,
          "serverName": "PREMIUM 1 USA",
          "location": "USA",
          "status": "online",
          "connectedUsers": 128,
          "cpuUsage": 45.0,
          "memoryUsage": 72.1,
          "lastUpdate": "2025-12-30T18:30:00.000Z"
        },
        {
          "serverId": 528,
          "serverName": "PREMIUM 1 AR",
          "location": "Argentina",
          "status": "online",
          "connectedUsers": 85,
          "cpuUsage": 28.3,
          "memoryUsage": 55.0,
          "lastUpdate": "2025-12-30T18:30:00.000Z"
        },
        {
          "serverId": 557,
          "serverName": "GRATUITO 1",
          "location": "Global",
          "status": "online",
          "connectedUsers": 256,
          "cpuUsage": 78.0,
          "memoryUsage": 85.5,
          "lastUpdate": "2025-12-30T18:30:00.000Z"
        }
      ]
    }
  }
}
```

---

### 2️⃣ Server-Sent Events (Tiempo Real)

```
GET https://shop.jhservices.com.ar/api/realtime/stream
```

**Descripción:** Conexión SSE para recibir actualizaciones en tiempo real sin hacer polling.

**Headers:**
```
Accept: text/event-stream
```

**Eventos recibidos:**
```
event: server-stats
data: {"fetchedAt":"2025-12-30T18:30:00.000Z","totalUsers":511,"onlineServers":4,"servers":[...]}
```

---

### 3️⃣ Stats Servidores (Alternativa REST)

```
GET https://shop.jhservices.com.ar/api/stats/servidores
```

**Response:**
```json
{
  "servidores": [...],
  "totalUsuarios": 511,
  "servidoresOnline": 4,
  "onlineServers": 4,
  "ultimaActualizacion": "2025-12-30T18:30:00.000Z"
}
```

---

## 📊 Campos por Servidor

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `serverId` | number | ID único del servidor |
| `serverName` | string | Nombre (ej: "PREMIUM 1 BR") |
| `location` | string | Ubicación: Argentina, Brasil, USA, Global |
| `status` | string | `"online"` o `"offline"` |
| `connectedUsers` | number | **Usuarios VPN conectados ahora** |
| `cpuUsage` | number | Uso CPU 0-100% |
| `memoryUsage` | number | Uso RAM 0-100% |
| `totalUsuarios` | number | Capacidad máxima del servidor |
| `lastUpdate` | string | Timestamp ISO última actualización |

---

## 🎯 Cómo Acceder a los Datos

```
// Total usuarios online global
response.data.serverStats.totalUsers

// Cantidad de servidores online
response.data.serverStats.onlineServers

// Lista de servidores
response.data.serverStats.servers

// Usuarios en un servidor específico
response.data.serverStats.servers[0].connectedUsers
```

---

## 💡 Recomendaciones de Implementación

### Estrategia sugerida:
1. **Al abrir la app:** Hacer fetch a `/realtime/snapshot`
2. **Mantener actualizado:** Conectar a `/realtime/stream` (SSE)
3. **Fallback:** Si SSE falla, polling a `/realtime/snapshot` cada 30-60 segundos

### UI sugerida:
```
🟢 PREMIUM AR      [85 usuarios]   ▓▓▓░░ 28% CPU
🟡 PREMIUM USA     [128 usuarios]  ▓▓▓▓░ 45% CPU  
🟢 PREMIUM BR      [42 usuarios]   ▓▓░░░ 35% CPU
🔴 GRATUITO        [256 usuarios]  ▓▓▓▓▓ 78% CPU

Total usuarios online: 511
```

### Colores por carga:
- 🟢 Verde: CPU < 50%
- 🟡 Amarillo: CPU 50-80%
- 🔴 Rojo: CPU > 80%

---

## 🧪 Probar en Terminal

```bash
# Snapshot
curl https://shop.jhservices.com.ar/api/realtime/snapshot

# Stats servidores
curl https://shop.jhservices.com.ar/api/stats/servidores
```
