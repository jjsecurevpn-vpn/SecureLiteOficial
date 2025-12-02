import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useNavigationState } from '../useNavigationState';

describe('useNavigationState', () => {
  it('redirige a términos cuando no se aceptaron', async () => {
    const { result } = renderHook(() => useNavigationState(false));

    await waitFor(() => {
      expect(result.current.screen).toBe('terms');
    });
  });

  it('permite cambiar de pantalla cuando los términos están aceptados', () => {
    const { result } = renderHook(() => useNavigationState(true));

    act(() => {
      result.current.setScreen('servers');
    });

    expect(result.current.screen).toBe('servers');
  });
});
