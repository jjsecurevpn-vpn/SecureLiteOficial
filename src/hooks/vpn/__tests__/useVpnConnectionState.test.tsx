import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useVpnConnectionState } from '../useVpnConnectionState';
import type { Credentials } from '../../../types';

const bridgeMock = vi.hoisted(() => {
  const listeners = new Map<string, (payload: unknown) => void>();
  const dtCall = vi.fn();
  const dtSet = vi.fn();
  let jsonConfig: unknown = null;

  return {
    listeners,
    dtCall,
    dtSet,
    emit: (name: string, payload?: unknown) => listeners.get(name)?.(payload),
    reset() {
      dtCall.mockReset();
      dtSet.mockReset();
      listeners.clear();
      jsonConfig = null;
    },
    getJsonConfig: () => jsonConfig,
    setJsonConfig: (value: unknown) => {
      jsonConfig = value;
    },
  };
});

vi.mock('../../../services/vpnBridge', () => ({
  dt: {
    call: (...args: Parameters<typeof bridgeMock.dtCall>) => bridgeMock.dtCall(...args),
    set: (...args: Parameters<typeof bridgeMock.dtSet>) => bridgeMock.dtSet(...args),
    get jsonConfigAtual() {
      return bridgeMock.getJsonConfig();
    },
  },
  getBestIP: vi.fn(() => '1.2.3.4'),
  getOperator: vi.fn(() => 'TestNet'),
  getAppVersions: vi.fn(() => 'cfg/app'),
  onNativeEvent: vi.fn((name: string, handler: (payload: unknown) => void) => {
    bridgeMock.listeners.set(name, handler);
    return () => bridgeMock.listeners.delete(name);
  }),
}));

const baseCreds: Credentials = { user: 'user', pass: 'pass', uuid: 'uuid' };

describe('useVpnConnectionState', () => {
  beforeEach(() => {
    bridgeMock.reset();
    bridgeMock.dtCall.mockImplementation((name: string) => {
      if (name === 'DtAppVersion') return '5.0.0';
      if (name === 'DtGetConfigs') return '[]';
      if (name === 'DtGetVpnState') return 'DISCONNECTED';
      return null;
    });
  });

  it('carga y ordena las categorías iniciales', async () => {
    bridgeMock.dtCall.mockImplementation((name: string) => {
      if (name === 'DtAppVersion') return '5.0.0';
      if (name === 'DtGetConfigs') {
        return JSON.stringify([
          { name: 'B', sorter: 2, items: [] },
          { name: 'A', sorter: 1, items: [] },
        ]);
      }
      if (name === 'DtGetVpnState') return 'DISCONNECTED';
      return null;
    });

    const { result } = renderHook(() =>
      useVpnConnectionState({ creds: baseCreds, persistCreds: vi.fn(), setScreen: vi.fn() })
    );

    await waitFor(() => expect(result.current.categorias.map(c => c.name)).toEqual(['A', 'B']));
  });

  it('ejecuta la secuencia de conexión estándar', () => {
    const persistCreds = vi.fn();
    const { result } = renderHook(() =>
      useVpnConnectionState({ creds: baseCreds, persistCreds, setScreen: vi.fn() })
    );

    const config = { id: '1', name: 'Server 1', mode: 'SSH', items: [] } as any;

    act(() => {
      result.current.setConfig(config);
    });

    act(() => {
      result.current.connect();
    });

    expect(bridgeMock.dtCall).toHaveBeenCalledWith('DtSetConfig', '1');
    expect(bridgeMock.dtCall).toHaveBeenCalledWith('DtExecuteVpnStart');
    expect(result.current.status).toBe('CONNECTING');
    expect(persistCreds).toHaveBeenCalled();
  });

  it('inicia auto-connect y fuerza el regreso a home', () => {
    vi.useFakeTimers();
    const setScreen = vi.fn();
    bridgeMock.dtCall.mockImplementation((name: string) => {
      if (name === 'DtAppVersion') return '5.0.0';
      if (name === 'DtGetConfigs') return '[]';
      if (name === 'DtGetVpnState') return 'DISCONNECTED';
      if (name === 'DtExecuteVpnStart') return null;
      if (name === 'DtSetConfig') return null;
      if (name === 'DtExecuteVpnStop') return null;
      return null;
    });

    const { result } = renderHook(() =>
      useVpnConnectionState({ creds: baseCreds, persistCreds: vi.fn(), setScreen })
    );

    const category = {
      name: 'Test',
      items: [{ id: 'auto', name: 'Auto', mode: 'SSH' }],
    } as any;

    act(() => {
      result.current.startAutoConnect(category);
    });

    expect(result.current.status).toBe('CONNECTING');
    expect(setScreen).toHaveBeenCalledWith('home');

    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(bridgeMock.dtCall).toHaveBeenCalledWith('DtExecuteVpnStart');
    vi.useRealTimers();
  });
});
