import { act, renderHook } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { useVpnUserState } from '../useVpnUserState';
import type { Credentials, ServerConfig, VpnStatus } from '../../../types';

const bridgeMock = vi.hoisted(() => {
  const listeners = new Map<string, (payload: unknown) => void>();
  const dtCall = vi.fn();
  return {
    listeners,
    dtCall,
    emit: (name: string, payload?: unknown) => listeners.get(name)?.(payload),
    reset() {
      dtCall.mockReset();
      listeners.clear();
    },
  };
});

vi.mock('../../../services/vpnBridge', () => ({
  dt: {
    call: (...args: Parameters<typeof bridgeMock.dtCall>) => bridgeMock.dtCall(...args),
    set: vi.fn(),
    get jsonConfigAtual() {
      return null;
    },
  },
  getBestIP: vi.fn(() => '10.0.0.1'),
  getOperator: vi.fn(() => 'MockTel'),
  getAppVersions: vi.fn(() => 'cfg/app'),
  onNativeEvent: vi.fn((name: string, handler: (payload: unknown) => void) => {
    bridgeMock.listeners.set(name, handler);
    return () => bridgeMock.listeners.delete(name);
  }),
}));

const baseCreds: Credentials = { user: 'demo', pass: '123', uuid: 'uuid' };
const baseConfig = { id: 'cfg', name: 'CFG', mode: 'SSH' } as ServerConfig;

describe('useVpnUserState', () => {
  beforeEach(() => {
    bridgeMock.reset();
    vi.useFakeTimers();
    bridgeMock.dtCall.mockImplementation((name: string) => {
      if (name === 'DtGetPingResult') return '55 ms';
      if (name === 'DtGetUserInfo') return JSON.stringify({ username: 'remote' });
      return null;
    });
  });

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();
  });

  const renderUserHook = (status: VpnStatus) => {
    let hookReturn: any = null;
    act(() => {
      hookReturn = renderHook(() => useVpnUserState({ status, config: baseConfig, creds: baseCreds }));
    });
    return hookReturn!;
  };

  it('consume eventos nativos para poblar el usuario', () => {
    const { result } = renderUserHook('DISCONNECTED');

    act(() => {
      bridgeMock.emit('DtCheckUserResultEvent', JSON.stringify({ username: 'john' }));
    });

    expect(result.current.user?.name).toBe('john');
  });

  it('solicita datos al conectarse y actualiza ping/top info', () => {
    const renderWrapper = ({ status }: { status: VpnStatus }) =>
      useVpnUserState({ status, config: baseConfig, creds: baseCreds });

    let hookReturn: any = null;

    act(() => {
      hookReturn = renderHook(renderWrapper, { initialProps: { status: 'DISCONNECTED' as VpnStatus } });
    });

    const { result, rerender } = hookReturn!;

    act(() => {
      rerender({ status: 'CONNECTED' });
      vi.runOnlyPendingTimers();
    });

    expect(bridgeMock.dtCall).toHaveBeenCalledWith('DtGetUserInfo');
    expect(result.current.topInfo).toEqual({ op: 'MockTel', ip: '10.0.0.1', ver: 'cfg/app' });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.pingMs).toBe(55);
  });
});
