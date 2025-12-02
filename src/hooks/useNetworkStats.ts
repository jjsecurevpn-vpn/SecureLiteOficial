import { useCallback, useEffect, useState } from 'react';
import { dt } from '../services/vpnBridge';
import { formatBytes } from '../utils/formatUtils';

interface NetworkStats {
  /** Bytes descargados */
  download: number;
  /** Bytes subidos */
  upload: number;
  /** Total usado */
  total: number;
  /** Formateado para mostrar */
  formatted: {
    download: string;
    upload: string;
    total: string;
  };
}

/**
 * Hook para obtener estadísticas de red en tiempo real
 * @param refreshInterval - Intervalo de actualización en ms (default: 1000)
 */
export function useNetworkStats(refreshInterval = 1000): NetworkStats {
  const [stats, setStats] = useState<NetworkStats>(() => getStats());

  const refresh = useCallback(() => {
    setStats(getStats());
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [refresh, refreshInterval]);

  return stats;
}

function getStats(): NetworkStats {
  const download = +(dt.call<number>('DtGetNetworkDownloadBytes') || 0);
  const upload = +(dt.call<number>('DtGetNetworkUploadBytes') || 0);
  const total = download + upload;

  return {
    download,
    upload,
    total,
    formatted: {
      download: formatBytes(download),
      upload: formatBytes(upload),
      total: formatBytes(total),
    },
  };
}
