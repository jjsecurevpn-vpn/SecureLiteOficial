import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useVpnController } from '../useVpnController';

const hookMocks = vi.hoisted(() => ({
  useCredentialsState: vi.fn(),
  useTermsState: vi.fn(),
  useNavigationState: vi.fn(),
  useVpnConnectionState: vi.fn(),
  useVpnUserState: vi.fn(),
}));

vi.mock('../useCredentialsState', () => ({
  useCredentialsState: (...args: Parameters<typeof hookMocks.useCredentialsState>) =>
    hookMocks.useCredentialsState(...args),
}));

vi.mock('../useTermsState', () => ({
  useTermsState: (...args: Parameters<typeof hookMocks.useTermsState>) =>
    hookMocks.useTermsState(...args),
}));

vi.mock('../useNavigationState', () => ({
  useNavigationState: (...args: Parameters<typeof hookMocks.useNavigationState>) =>
    hookMocks.useNavigationState(...args),
}));

vi.mock('../useVpnConnectionState', () => ({
  useVpnConnectionState: (...args: Parameters<typeof hookMocks.useVpnConnectionState>) =>
    hookMocks.useVpnConnectionState(...args),
}));

vi.mock('../useVpnUserState', () => ({
  useVpnUserState: (...args: Parameters<typeof hookMocks.useVpnUserState>) =>
    hookMocks.useVpnUserState(...args),
}));

describe('useVpnController', () => {
  const credsState = { creds: { user: 'u', pass: 'p', uuid: 'id' }, setCreds: vi.fn(), persistCreds: vi.fn() };
  const termsState = { termsAccepted: true, acceptTerms: vi.fn() };
  const navigationState = { screen: 'home' as const, setScreen: vi.fn() };
  const connectionState = {
    status: 'CONNECTED' as const,
    config: { id: 'cfg', name: 'Server', mode: 'SSH' },
    categorias: [{ name: 'Cat', items: [] }] as any,
    auto: { enabled: true, categoryId: 'cat' },
    needsUpdate: false,
    setConfig: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    cancelConnecting: vi.fn(),
    startAutoConnect: vi.fn(),
    loadCategorias: vi.fn(),
  };
  const userState = {
    user: { name: 'John' },
    topInfo: { balance: 10 },
    pingMs: 42,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    hookMocks.useCredentialsState.mockReturnValue(credsState);
    hookMocks.useTermsState.mockReturnValue(termsState);
    hookMocks.useNavigationState.mockReturnValue(navigationState);
    hookMocks.useVpnConnectionState.mockReturnValue(connectionState);
    hookMocks.useVpnUserState.mockReturnValue(userState);
  });

  it('combina los sub hooks en una sola interfaz', () => {
    const { result } = renderHook(() => useVpnController());

    expect(result.current.status).toBe(connectionState.status);
    expect(result.current.config).toBe(connectionState.config);
    expect(result.current.categorias).toBe(connectionState.categorias);
    expect(result.current.auto).toBe(connectionState.auto);
    expect(result.current.needsUpdate).toBe(connectionState.needsUpdate);
    expect(result.current.user).toBe(userState.user);
    expect(result.current.topInfo).toBe(userState.topInfo);
    expect(result.current.pingMs).toBe(userState.pingMs);
    expect(result.current.creds).toBe(credsState.creds);
    expect(result.current.screen).toBe(navigationState.screen);
    expect(result.current.termsAccepted).toBe(termsState.termsAccepted);

    expect(result.current.setScreen).toBe(navigationState.setScreen);
    expect(result.current.setCreds).toBe(credsState.setCreds);
    expect(result.current.acceptTerms).toBe(termsState.acceptTerms);
    expect(result.current.setConfig).toBe(connectionState.setConfig);
    expect(result.current.connect).toBe(connectionState.connect);
    expect(result.current.disconnect).toBe(connectionState.disconnect);
    expect(result.current.cancelConnecting).toBe(connectionState.cancelConnecting);
    expect(result.current.startAutoConnect).toBe(connectionState.startAutoConnect);
    expect(result.current.loadCategorias).toBe(connectionState.loadCategorias);
  });

  it('propaga las dependencias correctas hacia cada hook', () => {
    renderHook(() => useVpnController());

    expect(hookMocks.useNavigationState).toHaveBeenCalledWith(termsState.termsAccepted);
    expect(hookMocks.useVpnConnectionState).toHaveBeenCalledWith({
      creds: credsState.creds,
      persistCreds: credsState.persistCreds,
      setScreen: navigationState.setScreen,
    });
    expect(hookMocks.useVpnUserState).toHaveBeenCalledWith({
      status: connectionState.status,
      config: connectionState.config,
      creds: credsState.creds,
    });
  });
});
