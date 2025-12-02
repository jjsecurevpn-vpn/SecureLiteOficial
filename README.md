# JJSecureLite VPN

Una aplicación VPN moderna construida con React y TypeScript, diseñada para integrarse con aplicaciones Android nativas a través de WebView.

## 🚀 Características

- **Conexión VPN segura** con soporte para múltiples servidores
- **Interfaz moderna** y responsive
- **Sistema de autenticación** con credenciales de usuario
- **Estadísticas en tiempo real** de conexión (velocidad de descarga/subida, tiempo de sesión)
- **Registro de logs** para depuración
- **Soporte Premium** con diferentes niveles de suscripción
- **Auto-conexión** configurable
- **Notificaciones Toast** para feedback al usuario

## 🛠️ Tecnologías

- **React 18** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **CSS Modules** - Estilos modulares

## 📦 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/jjsecurevpn-vpn/SecureLiteOficial.git

# Entrar al directorio
cd SecureLiteOficial

# Instalar dependencias
npm install
```

## 🔧 Scripts disponibles

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Build inline (HTML único)
npx tsx build-inline.ts

# Preview del build
npm run preview
```

## 📁 Estructura del proyecto

```
src/
├── components/          # Componentes de React
│   ├── ui/             # Componentes de UI reutilizables
│   ├── HomeScreen.tsx  # Pantalla principal
│   ├── ServersScreen.tsx # Selección de servidores
│   ├── AccountScreen.tsx # Información de cuenta
│   └── ...
├── context/            # Contextos de React (VPN, Toast)
├── hooks/              # Custom hooks
│   └── vpn/           # Hooks específicos de VPN
├── services/           # Servicios (vpnBridge)
├── styles/             # Estilos CSS
│   ├── components/    # Estilos de componentes
│   └── screens/       # Estilos de pantallas
├── types/              # Definiciones de TypeScript
└── utils/              # Utilidades y helpers
```

## 🔌 Integración con Android

Esta aplicación está diseñada para funcionar dentro de un WebView de Android. La comunicación con la app nativa se realiza a través de:

- **`window.NativeAPI`** - Métodos para llamar funciones nativas
- **Eventos personalizados** - Para recibir actualizaciones del estado de la VPN

Consulta [APIS_NATIVAS.md](./APIS_NATIVAS.md) para más detalles sobre la integración.

## 📱 Pantallas

| Pantalla | Descripción |
|----------|-------------|
| Home | Estado de conexión y botón principal |
| Servers | Lista de servidores disponibles |
| Account | Información del usuario y suscripción |
| Logs | Registro de actividad para depuración |
| Menu | Navegación y configuración |
| Terms | Términos y condiciones |

## 🎨 Temas

La aplicación utiliza variables CSS para un sistema de colores consistente, definidas en `src/styles/variables.css`.

## 📄 Licencia

Este proyecto es privado y de uso exclusivo para JJSecure VPN.

---

Desarrollado con ❤️ por JJSecure Team
