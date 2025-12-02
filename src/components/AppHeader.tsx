import { memo, useCallback } from 'react';
import { useVpn } from '../context/VpnContext';
import { callOne } from '../services/vpnBridge';
import { UI_MESSAGES } from '../constants';

interface AppHeaderProps {
  onMenuClick: () => void;
}

/**
 * Barra superior de navegación de la app
 * Anteriormente llamado "TopBar"
 */
export const AppHeader = memo(function AppHeader({ onMenuClick }: AppHeaderProps) {
  const { screen, setScreen, selectedCategory, setSelectedCategory } = useVpn();

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
    if (callOne(['DtStartWebViewActivity'], 'https://shop.jhservices.com.ar/planes')) return;
    if (callOne(['DtOpenExternalUrl'], 'https://shop.jhservices.com.ar/planes')) return;
    window.open('https://shop.jhservices.com.ar/planes', '_blank');
  }, []);

  return (
    <header className="topbar">
      {isSubScreen ? (
        <button className="btn hotzone" onClick={handleClick}>
          <i className="fa fa-arrow-left" /> {isCategoryDetail ? UI_MESSAGES.servers.backToCategories : UI_MESSAGES.buttons.back}
        </button>
      ) : (
        <div className="dots hotzone" onClick={handleClick} aria-hidden="true">
          <span /><span /><span /><span />
        </div>
      )}
      <div className="row">
        <button className="chip" onClick={handleSubscribe}>👑 Suscribirse a un plan</button>
      </div>
    </header>
  );
});

/** @deprecated Usar AppHeader */
export { AppHeader as TopBar };
