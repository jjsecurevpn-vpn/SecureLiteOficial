import { useCallback, useState } from 'react';
import type { Category, ServerConfig } from '@/shared/types';
import { dt } from '../../api/vpnBridge';
import { appLogger } from '@/features/logs/model/useAppLogs';

/**
 * Hook para manejar la lista de servidores/categorías
 */
export function useServers() {
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [config, setConfigState] = useState<ServerConfig | null>(null);

  const loadCategorias = useCallback(() => {
    try {
      const raw = dt.call<string>('DtGetConfigs');

      if (!raw || raw === '[]' || raw === '') {
        appLogger.add('warn', '⚠️ DtGetConfigs devolvió lista vacía o null — usando MOCK');
        const mock: Category[] = [
          {
            name: 'MOCK A',
            sorter: 10,
            items: [
              { id: 'mock-a-1', name: 'Mock Server A1', description: '127.0.0.1', mode: 'udp', ip: '127.0.0.1', sorter: 1 },
              { id: 'mock-a-2', name: 'Mock Server A2', description: '127.0.0.2', mode: 'udp', ip: '127.0.0.2', sorter: 2 },
            ],
          },
          {
            name: 'MOCK B',
            sorter: 20,
            items: [
              { id: 'mock-b-1', name: 'Mock Server B1', description: '10.0.0.1', mode: 'tcp', ip: '10.0.0.1', sorter: 1 },
              { id: 'mock-b-2', name: 'Mock Server B2', description: '10.0.0.2', mode: 'tcp', ip: '10.0.0.2', sorter: 2 },
            ],
          },
        ];
        setCategorias(mock);
        return;
      }

      let cats: Category[];
      try {
        cats = JSON.parse(raw) as Category[];
      } catch (err) {
        appLogger.add('error', '❌ Error parseando DtGetConfigs — usando MOCK');
        const mock: Category[] = [
          {
            name: 'MOCK A',
            sorter: 10,
            items: [
              { id: 'mock-a-1', name: 'Mock Server A1', description: '127.0.0.1', mode: 'udp', ip: '127.0.0.1', sorter: 1 },
              { id: 'mock-a-2', name: 'Mock Server A2', description: '127.0.0.2', mode: 'udp', ip: '127.0.0.2', sorter: 2 },
            ],
          },
          {
            name: 'MOCK B',
            sorter: 20,
            items: [
              { id: 'mock-b-1', name: 'Mock Server B1', description: '10.0.0.1', mode: 'tcp', ip: '10.0.0.1', sorter: 1 },
              { id: 'mock-b-2', name: 'Mock Server B2', description: '10.0.0.2', mode: 'tcp', ip: '10.0.0.2', sorter: 2 },
            ],
          },
        ];
        setCategorias(mock);
        return;
      }

      appLogger.add('info', `✓ Servidores cargados: ${cats.length} categorías`);
      cats.sort((a, b) => (a.sorter || 0) - (b.sorter || 0));
      cats.forEach(c => c.items?.sort((a, b) => (a.sorter || 0) - (b.sorter || 0)));
      setCategorias(cats);
    } catch (error) {
      appLogger.add('error', `❌ Error cargando categorías: ${String(error)}`);
      setCategorias([]);
    }
  }, []);

  const setConfig = useCallback((c: ServerConfig) => {
    dt.call('DtSetConfig', c.id);
    setConfigState(c);
  }, []);

  const loadInitialConfig = useCallback(() => {
    const cfg = dt.jsonConfigAtual as ServerConfig | null;
    if (!cfg) {
      appLogger.add('warn', '⚠️ No hay config inicial (jsonConfigAtual es null)');
    } else {
      appLogger.add('info', `✓ Config inicial: ${cfg.name}`);
    }
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

