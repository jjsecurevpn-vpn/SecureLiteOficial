import { memo, useCallback } from 'react';
import { Button } from './ui/Button';
import { callOne } from '../services/vpnBridge';

export const PremiumCard = memo(function PremiumCard() {
  const openPremiumUrl = useCallback((url: string) => {
    if (callOne(['DtStartWebViewActivity'], url)) return;
    if (callOne(['DtOpenExternalUrl'], url)) return;
    window.open(url, '_blank');
  }, []);

  const handleBuy = useCallback(() => {
    openPremiumUrl('https://shop.jhservices.com.ar/planes');
  }, [openPremiumUrl]);

  const handleResell = useCallback(() => {
    openPremiumUrl('https://shop.jhservices.com.ar/revendedores');
  }, [openPremiumUrl]);

  return (
    <div className="info-card premium-card">
      <div className="premium-card__body">
        <span className="summary-eyebrow">Premium</span>
        <h3>Comprar o revender</h3>
        <p className="summary-meta">
          Accede a planes oficiales o solicita tu app propia para revender con un diseño limpio, sin contacto ni spam.
        </p>
      </div>
      <div className="premium-card__actions">
        <Button variant="soft" onClick={handleBuy}>
          Comprar
        </Button>
        <Button variant="soft" onClick={handleResell}>
          Revender
        </Button>
      </div>
    </div>
  );
});
