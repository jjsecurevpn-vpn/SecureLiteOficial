import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCredentialsState } from '../useCredentialsState';
import { loadCredentials, saveCredentials } from '../../../utils/storageUtils';

vi.mock('../../../utils/storageUtils', () => ({
  loadCredentials: vi.fn(() => ({ user: 'a', pass: 'b', uuid: 'c' })),
  saveCredentials: vi.fn(),
}));

const loadCredentialsMock = vi.mocked(loadCredentials);
const saveCredentialsMock = vi.mocked(saveCredentials);

describe('useCredentialsState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inicializa con las credenciales almacenadas', () => {
    loadCredentialsMock.mockReturnValueOnce({ user: 'foo', pass: 'bar', uuid: 'baz' });
    const { result } = renderHook(() => useCredentialsState());
    expect(result.current.creds).toEqual({ user: 'foo', pass: 'bar', uuid: 'baz' });
  });

  it('guarda las credenciales al actualizarlas', () => {
    const { result } = renderHook(() => useCredentialsState());

    act(() => {
      result.current.setCreds({ user: 'neo' });
    });

    expect(result.current.creds.user).toBe('neo');
    expect(saveCredentialsMock).toHaveBeenCalledWith('neo', 'b', 'c');
  });

  it('persistCreds vuelve a escribir los valores actuales', () => {
    const { result } = renderHook(() => useCredentialsState());

    act(() => {
      result.current.persistCreds();
    });

    expect(saveCredentialsMock).toHaveBeenCalledWith('a', 'b', 'c');
  });
});
