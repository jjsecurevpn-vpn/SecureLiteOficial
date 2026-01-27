import { useState } from 'react';
import { VpnProvider, useVpn } from '../features/vpn/model/VpnContext';
import { ToastProvider, useToastContext } from '../shared/toast/ToastContext';
import { ErrorBoundary } from '../shared/components/ErrorBoundary';
import { AppHeader } from '../shared/components/AppHeader';
import { ConnectionStatusBanner } from '../shared/components/ConnectionStatusBanner';
import { CouponModal } from '../shared/components/CouponModal';
import { HomeScreen } from '../pages/HomeScreen';
import { ServersScreen } from '../pages/ServersScreen';
import { MenuScreen } from '../pages/MenuScreen';
import { LogsScreen } from '../pages/LogsScreen';
import { AppLogsScreen } from '../pages/AppLogsScreen';
import { TermsScreen } from '../pages/TermsScreen';
import { AccountScreen } from '../pages/AccountScreen';
import { Toast } from '../shared/ui/Toast';
import { useConnectionStatus } from '../features/vpn/model/useConnectionStatus';
import { useSafeArea } from '../shared/hooks/useSafeArea';
import type { ScreenType } from '../shared/types';

type Coupon = {
  id: number;
  codigo: string;
  tipo: string;
  valor: number;
  limite_uso: number;
  usos_actuales: number;
  activo: boolean;
  oculto: boolean;
};

/** Mapeo de pantallas a componentes */
const SCREEN_COMPONENTS: Record<ScreenType, React.ComponentType> = {
  home: HomeScreen,
  servers: ServersScreen,
  menu: MenuScreen,
  logs: LogsScreen,
  applogs: AppLogsScreen,
  terms: TermsScreen,
  account: AccountScreen,
};

function AppContent() {
  const { screen, setScreen } = useVpn();
  const { toast } = useToastContext();
  const { isConnected, isConnecting } = useConnectionStatus();
  const { navigationBarHeight } = useSafeArea();
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [modalCoupons, setModalCoupons] = useState<Coupon[]>([]);

  // Determinar clase de estado (isConnecting incluye auto.on para evitar flash rojo)
  const stateClass = isConnected 
    ? 'state-connected' 
    : isConnecting 
      ? 'state-connecting' 
      : 'state-disconnected';

  // Obtener componente de pantalla
  const ScreenComponent = SCREEN_COMPONENTS[screen] || HomeScreen;

  const screenClass = screen === 'home' ? 'is-home' : `is-${screen}`;

  const phoneStyle = {
    ['--nav-safe' as any]: `${navigationBarHeight}px`,
  };

  const handleShowCouponModal = (coupons: Coupon[]) => {
    console.log('[DEBUG] App: handleShowCouponModal called, coupons:', coupons);
    setModalCoupons(coupons);
    setShowCouponModal(true);
  };

  const handleCloseCouponModal = () => {
    setShowCouponModal(false);
  };

  return (
    <div className={`phone ${stateClass} ${screenClass}`} id="app" style={phoneStyle}>
      <div className="top-strip" />
      
      {screen !== 'terms' && (
        <>
          <AppHeader onMenuClick={() => setScreen('menu')} onShowCouponModal={handleShowCouponModal} />
          {screen === 'home' && <ConnectionStatusBanner />}
        </>
      )}

      <ScreenComponent />
      
      <Toast message={toast.message} visible={toast.visible} />

      {showCouponModal && (
        <CouponModal coupons={modalCoupons} onClose={handleCloseCouponModal} />
      )}
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
