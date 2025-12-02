import { useCallback, useState } from 'react';
import { callOne } from '../../services/vpnBridge';
import { isTermsAccepted, acceptTerms as acceptTermsStorage } from '../../utils/storageUtils';

export function useTermsState() {
  const [termsAccepted, setTermsAccepted] = useState(isTermsAccepted());

  const acceptTerms = useCallback(() => {
    acceptTermsStorage();
    setTermsAccepted(true);
    callOne(['DtAcceptTerms']);
  }, []);

  return { termsAccepted, acceptTerms };
}
