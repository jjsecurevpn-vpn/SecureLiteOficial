import { memo, useState } from 'react';

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

type CouponModalProps = {
  coupons: Coupon[];
  onClose: () => void;
};

export const CouponModal = memo(function CouponModal({ coupons, onClose }: CouponModalProps) {
  const activeCoupons = coupons.filter(c => c.activo && !c.oculto);
  const [copied, setCopied] = useState<Record<number, boolean>>({});

  const copyCoupon = async (code: string, id: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(prev => ({ ...prev, [id]: true }));
      window.setTimeout(() => setCopied(prev => ({ ...prev, [id]: false })), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content coupon-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <div className="header-content">
            <div className="icon-wrapper">
              <i className="fa fa-ticket" />
            </div>
            <div className="header-text">
              <h3>Cupones disponibles</h3>
              <p>Aprovecha descuentos exclusivos</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {activeCoupons.length === 0 ? (
            <div className="empty-state">
              <p>No hay cupones activos en este momento</p>
            </div>
          ) : (
            <div className="coupons-grid">
              {activeCoupons.map(coupon => {
                const remaining = Math.max(0, coupon.limite_uso - coupon.usos_actuales);
                return (
                  <div key={coupon.id} className="coupon-card">
                    <div className="coupon-header">
                      <div className="coupon-code-wrapper">
                        <span className="coupon-label">Código</span>
                        <div className="coupon-code">{coupon.codigo}</div>
                      </div>
                      <div className="coupon-badge">
                        {coupon.tipo === 'porcentaje' ? `${coupon.valor}%` : `$${coupon.valor}`}
                        <span className="badge-label">descuento</span>
                      </div>
                    </div>

                    <div className="coupon-info">
                      <div className="info-item">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M8 5V8L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        <span>{remaining} {remaining === 1 ? 'uso restante' : 'usos restantes'}</span>
                      </div>
                    </div>

                    <p className="coupon-description">
                      Aplicable en la compra de cualquier plan
                    </p>

                    <div className="coupon-actions">
                      <button 
                        className="btn-primary" 
                        onClick={() => {
                          window.open('https://shop.jhservices.com.ar/planes','_blank');
                        }}
                      >
                        Ver planes
                      </button>
                      <button 
                        className="btn-copy" 
                        onClick={() => copyCoupon(coupon.codigo, coupon.id)}
                      >
                        {copied[coupon.id] ? (
                          <>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M13 4L6 11L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Copiado
                          </>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                              <path d="M11 5V3.5C11 2.67 10.33 2 9.5 2H3.5C2.67 2 2 2.67 2 3.5V9.5C2 10.33 2.67 11 3.5 11H5" stroke="currentColor" strokeWidth="1.5"/>
                            </svg>
                            Copiar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Use external CSS: src/styles/components/modal.css */}
    </div>
  );
});

export default CouponModal;