import { useCallback, useState } from 'react';
import type { Credentials } from '../../types';
import { loadCredentials, saveCredentials } from '../../utils/storageUtils';

interface UseCredentialsState {
  creds: Credentials;
  setCreds: (creds: Partial<Credentials>) => void;
  persistCreds: () => void;
}

export function useCredentialsState(): UseCredentialsState {
  const [creds, setCredsState] = useState<Credentials>(() => loadCredentials());

  const setCreds = useCallback((partial: Partial<Credentials>) => {
    setCredsState(prev => {
      const next = { ...prev, ...partial };
      saveCredentials(next.user, next.pass, next.uuid);
      return next;
    });
  }, []);

  const persistCreds = useCallback(() => {
    setCredsState(prev => {
      saveCredentials(prev.user, prev.pass, prev.uuid);
      return prev;
    });
  }, []);

  return { creds, setCreds, persistCreds };
}
