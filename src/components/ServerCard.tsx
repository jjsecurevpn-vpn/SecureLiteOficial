import { memo, useState, useCallback } from 'react';
import type { ServerConfig } from '../types';

interface ServerCardProps {
  config: ServerConfig | null;
  onClick: () => void;
  disabled?: boolean;
}

/**
 * Tarjeta que muestra el servidor seleccionado
 * Anteriormente llamado "LocationCard"
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
      aria-label="Elegir servidor"
    >
      <div className="loc-left">
        <div className="flag">
          {showFallback ? (
            <span className="flag-fallback">{fallbackEmoji}</span>
          ) : (
            <img 
              src={icon} 
              alt={config?.name || 'Servidor'} 
              onError={handleImgError}
            />
          )}
        </div>
        <div>
          <div className="loc-name">
            {config?.name || 'Elige un servidor'}
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

/** @deprecated Usar ServerCard */
export { ServerCard as LocationCard };
