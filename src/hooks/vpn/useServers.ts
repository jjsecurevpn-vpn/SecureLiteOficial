import { useCallback, useState } from 'react';
import type { Category, ServerConfig } from '../../types';
import { dt } from '../../services/vpnBridge';

/**
 * Hook para manejar la lista de servidores/categorías
 */
export function useServers() {
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [config, setConfigState] = useState<ServerConfig | null>(null);

  const loadCategorias = useCallback(() => {
    try {
      const raw = dt.call<string>('DtGetConfigs');
      let cats: Category[] = JSON.parse(raw || '[]');
      cats.sort((a, b) => (a.sorter || 0) - (b.sorter || 0));
      cats.forEach(c => c.items?.sort((a, b) => (a.sorter || 0) - (b.sorter || 0)));
      setCategorias(cats);
    } catch {
      setCategorias([]);
    }
  }, []);

  const setConfig = useCallback((c: ServerConfig) => {
    dt.call('DtSetConfig', c.id);
    setConfigState(c);
  }, []);

  const loadInitialConfig = useCallback(() => {
    const cfg = dt.jsonConfigAtual as ServerConfig | null;
    if (cfg) setConfigState(cfg);
  }, []);

  return {
    categorias,
    config,
    setConfig,
    setConfigState,
    loadCategorias,
    loadInitialConfig,
  };
}
