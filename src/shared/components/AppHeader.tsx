import { memo, useCallback, useEffect, useState } from 'react';
import { useVpn } from '../../features/vpn/model/VpnContext';
import { callOne } from '../../features/vpn/api/vpnBridge';
import { UI_MESSAGES } from '../../constants';
import { useTheme } from '../hooks/useTheme';

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

const COUPONS_URL = 'https://shop.jhservices.com.ar/api/cupones';

interface AppHeaderProps {
  onMenuClick: () => void;
  onShowCouponModal: (coupons: Coupon[]) => void;
}

/**
 * Barra superior de navegación de la app
 * Anteriormente llamado "TopBar"
 */
export const AppHeader = memo(function AppHeader({ onMenuClick, onShowCouponModal }: AppHeaderProps) {
  const { screen, setScreen, selectedCategory, setSelectedCategory } = useVpn();
  const { theme, toggleTheme } = useTheme();
  const [hasActiveCoupon, setHasActiveCoupon] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const activeCouponsCount = coupons.filter(c => c.activo && !c.oculto).length;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(COUPONS_URL, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          cache: 'no-store',
        });

        if (!response.ok) return;

        const data = await response.json();
        const coupons: Coupon[] = data?.data ?? [];

        if (cancelled) return;

        setCoupons(coupons);
        const active = coupons.some(coupon => coupon.activo && !coupon.oculto);
        setHasActiveCoupon(active);
      } catch {
        // Silent
      }
    }

    load();
    const pollId = window.setInterval(load, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(pollId);
    };
  }, []);

  const isSubScreen = screen !== 'home';
  const isCategoryDetail = screen === 'servers' && Boolean(selectedCategory);

  const handleClick = () => {
    if (isCategoryDetail) {
      setSelectedCategory(null);
      return;
    }
    if (isSubScreen) {
      setScreen('home');
    } else {
      onMenuClick();
    }
  };

  const handleSubscribe = useCallback(() => {
    if (callOne(['DtOpenExternalUrl'], 'https://shop.jhservices.com.ar/planes')) return;
    window.open('https://shop.jhservices.com.ar/planes', '_blank');
  }, []);

  const handleShowCoupons = useCallback(() => {
    console.log('[DEBUG] AppHeader: ticket clicked, coupons:', coupons);
    onShowCouponModal(coupons);
  }, [onShowCouponModal, coupons]);

  return (
    <header className="topbar">
      {isSubScreen ? (
        <button className="btn hotzone" onClick={handleClick} data-nav tabIndex={0}>
          <i className="fa fa-arrow-left" /> {isCategoryDetail ? UI_MESSAGES.servers.backToCategories : UI_MESSAGES.buttons.back}
        </button>
      ) : (
        <div className="dots hotzone" onClick={handleClick} aria-hidden="true">
          <span /><span /><span /><span />
        </div>
      )}
      <div className="row">
          {hasActiveCoupon && (
          <button
            type="button"
            className="icon-btn hotzone coupon-btn"
            onClick={handleShowCoupons}
            aria-label={`${activeCouponsCount} cupón(es) activo(s) disponible(s)`}
            title={`${activeCouponsCount} cupón(es) activo(s) disponible(s)`}
          >
            <i className="fa fa-ticket" aria-hidden="true" />
            {/* attention marker: exclamation to attract attention */}
            <span className="coupon-attention">!</span>
            {activeCouponsCount > 1 && <span className="coupon-badge">{activeCouponsCount}</span>}
          </button>
        )}
        <button
          type="button"
          className="icon-btn hotzone subscribe-btn"
          onClick={handleSubscribe}
          aria-label="Suscribirse a un plan"
          title="Suscribirse a un plan"
        >
          <i className="fa fa-shopping-cart" aria-hidden="true" />
        </button>

        <button
          type="button"
          className="icon-btn hotzone theme-btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          <i className={theme === 'dark' ? 'fa fa-sun' : 'fa fa-moon'} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
});
