import { memo, useCallback, useMemo } from 'react';
import { useVpn } from '../context/VpnContext';
import { useSectionStyle } from '../hooks';
import { Button } from './ui/Button';

const TERM_CARDS = [
  {
    icon: 'fa-scroll',
    color: 'var(--accent)',
    title: 'Acuerdo Legal',
    text: 'Al aceptar, estás de acuerdo en cumplir todos los términos de uso y condiciones de servicio detallados en nuestra política. El uso indebido resultará en suspensión de la cuenta.',
  },
  {
    icon: 'fa-shield-alt',
    color: '#39d98a',
    title: 'Política de Privacidad',
    text: 'Garantizamos la protección de tus datos. No almacenamos logs de actividad ni información de tráfico. Tu privacidad es nuestra prioridad.',
  },
  {
    icon: 'fa-ban',
    color: '#ef6573',
    title: 'Uso Prohibido',
    text: 'Está estrictamente prohibido el uso del servicio para actividades ilegales, spamming, ataques cibernéticos o cualquier violación de derechos de autor y propiedad intelectual.',
  },
  {
    icon: 'fa-sync-alt',
    color: '#f0a74b',
    title: 'Cambios Futuros',
    text: 'Nos reservamos el derecho de modificar estos términos en cualquier momento. Notificaremos a los usuarios sobre cambios significativos. El uso continuo implica aceptación de las nuevas reglas.',
  },
] as const;

export const TermsScreen = memo(function TermsScreen() {
  const { acceptTerms, setScreen, termsAccepted } = useVpn();
  const baseSectionStyle = useSectionStyle(16, 16);

  const handleAccept = useCallback(() => {
    acceptTerms();
    setScreen('home');
  }, [acceptTerms, setScreen]);

  const handleBack = useCallback(() => {
    setScreen('home');
  }, [setScreen]);

  const sectionStyle = useMemo(() => ({
    ...baseSectionStyle,
    inset: 0,
  }), [baseSectionStyle]);

  return (
    <section className="screen" style={sectionStyle}>
      <div className="pad" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="panel-title center" style={{ marginBottom: 'var(--space-xl)' }}>
          Términos de Uso y Política
        </div>

        <div className="terms-scroll" style={{ flex: 1, overflowY: 'auto', paddingRight: 2 }}>
          {TERM_CARDS.map((card, i) => (
            <div key={i} className="info-card term-card">
              <div className="row" style={{ marginBottom: 'var(--space-sm)' }}>
                <i className={`fa ${card.icon}`} style={{ color: card.color, fontSize: 'var(--font-lg)' }} />
                <strong style={{ fontSize: 'var(--font-md)' }}>{card.title}</strong>
              </div>
              <p className="muted" style={{ fontSize: 'var(--font-sm)' }}>{card.text}</p>
            </div>
          ))}
        </div>

        <div style={{ padding: 'var(--space-xl) 0', borderTop: '1px solid rgba(255,255,255,.05)' }}>
          {!termsAccepted ? (
            <Button variant="primary" onClick={handleAccept} className="full-width">
              ACEPTO LOS TÉRMINOS DE USO
            </Button>
          ) : (
            <Button variant="primary" onClick={handleBack} className="full-width">
              VOLVER
            </Button>
          )}
        </div>
      </div>
    </section>
  );
});
