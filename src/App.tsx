import { VpnProvider, useVpn } from './context/VpnContext';
import { ToastProvider, useToastContext } from './context/ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppHeader } from './components/AppHeader';
import { ConnectionStatusBanner } from './components/ConnectionStatusBanner';
import { HomeScreen } from './components/HomeScreen';
import { ServersScreen } from './components/ServersScreen';
import { MenuScreen } from './components/MenuScreen';
import { LogsScreen } from './components/LogsScreen';
import { TermsScreen } from './components/TermsScreen';
import { AccountScreen } from './components/AccountScreen';
import { Toast } from './components/ui/Toast';
import { useConnectionStatus } from './hooks';
import type { ScreenType } from './types';

// Estilos - importados directamente para mejor compatibilidad con Vite
import './styles/variables.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components/buttons.css';
import './styles/components/cards.css';
import './styles/components/forms.css';
import './styles/components/menu.css';
import './styles/components/chips.css';
import './styles/components/servers.css';
import './styles/components/logs.css';
import './styles/components/toast.css';
import './styles/components/premium.css';
import './styles/components/error-boundary.css';
import './styles/screens/home.css';
import './styles/screens/account.css';
import './styles/screens/terms.css';
import './styles/responsive.css';

/** Mapeo de pantallas a componentes */
const SCREEN_COMPONENTS: Record<ScreenType, React.ComponentType> = {
  home: HomeScreen,
  servers: ServersScreen,
  menu: MenuScreen,
  logs: LogsScreen,
  terms: TermsScreen,
  account: AccountScreen,
};

function AppContent() {
  const { screen, setScreen } = useVpn();
  const { toast } = useToastContext();
  const { isConnected, isConnecting } = useConnectionStatus();

  // Determinar clase de estado (isConnecting incluye auto.on para evitar flash rojo)
  const stateClass = isConnected 
    ? 'state-connected' 
    : isConnecting 
      ? 'state-connecting' 
      : 'state-disconnected';

  // Obtener componente de pantalla
  const ScreenComponent = SCREEN_COMPONENTS[screen] || HomeScreen;

  return (
    <div className={`phone ${stateClass}`} id="app">
      <div className="top-strip" />
      
      {screen !== 'terms' && (
        <>
          <AppHeader onMenuClick={() => setScreen('menu')} />
          {screen === 'home' && <ConnectionStatusBanner />}
        </>
      )}

      <ScreenComponent />
      
      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <VpnProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </VpnProvider>
    </ErrorBoundary>
  );
}
