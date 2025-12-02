import { useMemo } from 'react';
import { useSafeArea } from './useSafeArea';

interface SectionStyle {
  paddingTop: string;
  paddingBottom: string;
}

/**
 * Hook que genera el estilo de sección con safe area
 * Elimina la repetición del patrón sectionStyle en cada pantalla
 */
export function useSectionStyle(topOffset = 16, bottomOffset = 24): SectionStyle {
  const { statusBarHeight, navigationBarHeight } = useSafeArea();

  return useMemo(() => ({
    paddingTop: `calc(${statusBarHeight}px + ${topOffset}px)`,
    paddingBottom: `calc(${navigationBarHeight}px + ${bottomOffset}px)`,
  }), [statusBarHeight, navigationBarHeight, topOffset, bottomOffset]);
}
