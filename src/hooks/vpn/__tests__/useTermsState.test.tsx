import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTermsState } from '../useTermsState';
import { isTermsAccepted, acceptTerms as acceptTermsStorage } from '../../../utils/storageUtils';
import { callOne } from '../../../services/vpnBridge';

vi.mock('../../../utils/storageUtils', () => ({
  isTermsAccepted: vi.fn(() => false),
  acceptTerms: vi.fn(),
}));

vi.mock('../../../services/vpnBridge', () => ({
  callOne: vi.fn(() => false),
}));

const isTermsAcceptedMock = vi.mocked(isTermsAccepted);
const acceptTermsMock = vi.mocked(acceptTermsStorage);
const callOneMock = vi.mocked(callOne);

describe('useTermsState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('refleja el estado inicial almacenado', () => {
    isTermsAcceptedMock.mockReturnValueOnce(true);
    const { result } = renderHook(() => useTermsState());
    expect(result.current.termsAccepted).toBe(true);
  });

  it('marca términos como aceptados y sincroniza con nativo', () => {
    const { result } = renderHook(() => useTermsState());

    act(() => {
      result.current.acceptTerms();
    });

    expect(acceptTermsMock).toHaveBeenCalledTimes(1);
    expect(callOneMock).toHaveBeenCalledWith(['DtAcceptTerms']);
    expect(result.current.termsAccepted).toBe(true);
  });
});
