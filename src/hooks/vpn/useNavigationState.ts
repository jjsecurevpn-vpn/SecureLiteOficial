import { useCallback, useEffect, useState } from 'react';
import type { ScreenType } from '../../types';
import { SCREENS } from '../../constants';

export function useNavigationState(termsAccepted: boolean) {
  const [screen, setScreenState] = useState<ScreenType>('home');

  const setScreen = useCallback((next: ScreenType) => {
    if (!SCREENS.includes(next)) return;
    setScreenState(current => (current === next ? current : next));
  }, []);

  useEffect(() => {
    if (!termsAccepted && screen !== 'terms') {
      setScreenState('terms');
    }
  }, [screen, termsAccepted]);

  return { screen, setScreen };
}
