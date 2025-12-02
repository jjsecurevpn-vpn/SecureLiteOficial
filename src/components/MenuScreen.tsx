import { memo, useEffect, useState, useCallback } from 'react';
import { useVpn } from '../context/VpnContext';
import { useToastContext } from '../context/ToastContext';
import { useSectionStyle } from '../hooks';
import { callOne, dt } from '../services/vpnBridge';
import type { HotspotState } from '../types/native';
import { PremiumCard } from './PremiumCard';

interface MenuItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  action?: () => void;
}

export const MenuScreen = memo(function MenuScreen() {
  const { setScreen } = useVpn();
  const { showToast } = useToastContext();
  const [hotspotStatus, setHotspotStatus] = useState<HotspotState>('UNKNOWN');
  const [pressedItem, setPressedItem] = useState<string | null>(null);
  const sectionStyle = useSectionStyle();

  const refreshHotspotStatus = useCallback(() => {
    const status = dt.call<string>('DtGetStatusHotSpotService');
    if (status === 'RUNNING' || status === 'STOPPED') {
      setHotspotStatus(status);
    } else {
      setHotspotStatus('UNKNOWN');
    }
  }, []);

  useEffect(() => {
    refreshHotspotStatus();
  }, [refreshHotspotStatus]);

  const toggleHotspot = useCallback(() => {
    const starting = hotspotStatus !== 'RUNNING';
    const success = starting ? callOne(['DtStartHotSpotService']) : callOne(['DtStopHotSpotService']);
    if (success) {
      showToast(starting ? 'Hotspot iniciado' : 'Hotspot detenido');
      setTimeout(refreshHotspotStatus, 400);
    } else {
      showToast('No disponible en este dispositivo');
      setHotspotStatus('UNKNOWN');
    }
  }, [hotspotStatus, showToast, refreshHotspotStatus]);

  const handlePressStart = useCallback((id: string) => {
    setPressedItem(id);
  }, []);

  const handlePressEnd = useCallback(() => {
    setPressedItem(null);
  }, []);

  const menuItems: MenuItem[] = [
    {
      id: 'apn',
      title: 'APN',
      subtitle: 'Configuración del punto de acceso',
      icon: 'fa-signal',
      action: () => {
        if (!callOne(['DtStartApnActivity', 'DtOpenApn', 'DtApn'])) {
          showToast('No disponible en este dispositivo');
        }
      },
    },
    {
      id: 'battery',
      title: 'Batería',
      subtitle: 'Optimizaciones/uso de energía',
      icon: 'fa-bolt',
      action: () => {
        if (!callOne(['DtIgnoreBatteryOptimizations', 'DtOpenBatteryOptimization', 'DtOpenPower'])) {
          showToast('No disponible en este dispositivo');
        }
      },
    },
    {
      id: 'hotspot',
      title: hotspotStatus === 'RUNNING' ? 'Hotspot / Desactivar' : 'Hotspot / Activar',
      subtitle:
        hotspotStatus === 'RUNNING'
          ? 'Hotspot activo'
          : hotspotStatus === 'STOPPED'
            ? 'Hotspot inactivo'
            : 'Estado desconocido',
      icon: 'fa-wifi',
      action: hotspotStatus === 'UNKNOWN' ? undefined : toggleHotspot,
    },
    {
      id: 'speedtest',
      title: 'Speedtest',
      subtitle: 'Prueba de velocidad',
      icon: 'fa-gauge-high',
      action: () => {
        if (callOne(['DtStartWebViewActivity'], 'https://www.speedtest.net/')) return;
        if (callOne(['DtOpenExternalUrl'], 'https://fast.com')) return;
        window.open('https://fast.com', '_blank');
      },
    },
    {
      id: 'terms',
      title: 'Términos',
      subtitle: 'Términos y políticas',
      icon: 'fa-file-lines',
      action: () => setScreen('terms'),
    },
    {
      id: 'clean',
      title: 'Limpieza',
      subtitle: 'Limpiar caché/ajustes',
      icon: 'fa-broom',
      action: () => {
        if (callOne(['DtCleanApp'])) {
          showToast('Limpieza realizada');
        } else {
          showToast('No disponible en este dispositivo');
        }
      },
    },
    {
      id: 'logs',
      title: 'Registros',
      subtitle: 'Ver y copiar logs',
      icon: 'fa-terminal',
      action: () => setScreen('logs'),
    },
  ];

  return (
    <section className="screen" style={sectionStyle}>
      <div className="section-header">
        <div className="panel-title">Acciones</div>
      </div>

      <PremiumCard />

      <div className="menu-list">
        {menuItems.map((item) => {
          const disabled = typeof item.action !== 'function';
          return (
            <button
              key={item.id}
              type="button"
              className={`menu-row ${pressedItem === item.id ? 'menu-row--pressed' : ''}`}
              onClick={!disabled ? item.action : undefined}
              disabled={disabled}
              onPointerDown={() => handlePressStart(item.id)}
              onPointerUp={handlePressEnd}
              onPointerLeave={handlePressEnd}
              onPointerCancel={handlePressEnd}
            >
              <div className="menu-row__icon" aria-hidden="true">
                <i className={`fa ${item.icon}`} />
              </div>
              <div className="menu-row__body">
                <span className="menu-row__title">{item.title}</span>
                <span className="menu-row__subtitle">{item.subtitle}</span>
              </div>
              <i className="fa fa-chevron-right menu-row__chevron" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </section>
  );
});
