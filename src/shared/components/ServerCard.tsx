import { memo, useState, useCallback } from 'react';
import type { ServerConfig } from '../types';
import { UI_MESSAGES } from '../../constants';

interface ServerCardProps {
  config: ServerConfig | null;
  onClick: () => void;
  disabled?: boolean;
}

/**
 * Tarjeta que muestra el servidor seleccionado
 * Anteriormente llamado "LocationCard"
 * Nota: El estado de conexión se muestra en ConnectionStatusBanner
 */
export const ServerCard = memo(function ServerCard({ config, onClick, disabled }: ServerCardProps) {
  const icon = config?.icon?.trim();
  const isImg = !!icon && (/^(https?:)?\/\//i.test(icon) || icon.startsWith('data:'));
  const [imgError, setImgError] = useState(false);

  const handleImgError = useCallback(() => {
    setImgError(true);
  }, []);

  // Reset error state when icon changes
  const currentIcon = config?.icon;
  const [prevIcon, setPrevIcon] = useState(currentIcon);
  if (currentIcon !== prevIcon) {
    setPrevIcon(currentIcon);
    setImgError(false);
  }

  const showFallback = !isImg || !icon || imgError;
  const fallbackEmoji = icon && !isImg ? icon : '🌐';

  return (
    <div 
      className="location-card" 
      onClick={disabled ? undefined : onClick}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1 }}
      role="button"
      tabIndex={disabled ? -1 : 0}
      data-nav
      aria-label={UI_MESSAGES.serverCard.ariaChooseServer}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="loc-left">
        <div className="flag">
          {showFallback ? (
            <span className="flag-fallback">{fallbackEmoji}</span>
          ) : (
            <img 
              src={icon} 
              alt={config?.name || UI_MESSAGES.serverCard.altServer} 
              onError={handleImgError}
            />
          )}
        </div>
        <div className="loc-meta">
          <div className="loc-name">
            {config?.name || UI_MESSAGES.serverCard.pickServer}
          </div>
          {config?.description && (
            <div className="loc-ip">{config.description}</div>
          )}
        </div>
      </div>
      <i className="fa fa-chevron-right" aria-hidden="true" />
    </div>
  );
});
