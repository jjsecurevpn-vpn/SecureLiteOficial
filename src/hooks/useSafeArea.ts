import { useState, useEffect } from 'react';
import { dt } from '../services/vpnBridge';

const STATUS_FALLBACK = 24;
const NAV_FALLBACK = 48;
const MIN_CONTENT_HEIGHT = 320;

interface SafeAreaMetrics {
  statusBarHeight: number;
  navigationBarHeight: number;
  totalInset: number;
  viewportHeight: number;
  contentHeight: number;
}

const readHeight = (apiName: string, fallback: number): number => {
  const response = dt.call<number>(apiName);
  if (typeof response === 'number' && Number.isFinite(response) && response >= 0) {
    return response;
  }
  return fallback;
};

const computeMetrics = (): SafeAreaMetrics => {
  if (typeof window === 'undefined') {
    return {
      statusBarHeight: STATUS_FALLBACK,
      navigationBarHeight: NAV_FALLBACK,
      totalInset: STATUS_FALLBACK + NAV_FALLBACK,
      viewportHeight: 640,
      contentHeight: MIN_CONTENT_HEIGHT,
    };
  }

  const statusBarHeight = readHeight('DtGetStatusBarHeight', STATUS_FALLBACK);
  const navigationBarHeight = readHeight('DtGetNavigationBarHeight', NAV_FALLBACK);
  const viewportHeight = window.innerHeight || 640;
  const totalInset = statusBarHeight + navigationBarHeight;
  const contentHeight = Math.max(viewportHeight - totalInset, MIN_CONTENT_HEIGHT);

  return {
    statusBarHeight,
    navigationBarHeight,
    totalInset,
    viewportHeight,
    contentHeight,
  };
};

export function useSafeArea() {
  const [metrics, setMetrics] = useState<SafeAreaMetrics>(() => computeMetrics());

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleResize = () => {
      setMetrics(computeMetrics());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const refresh = () => setMetrics(computeMetrics());
  const getModalHeight = (percentage = 85) => Math.floor((metrics.contentHeight * percentage) / 100);

  return {
    statusBarHeight: metrics.statusBarHeight,
    navigationBarHeight: metrics.navigationBarHeight,
    totalInset: metrics.totalInset,
    viewportHeight: metrics.viewportHeight,
    contentHeight: metrics.contentHeight,
    refresh,
    getModalHeight,
  };
}
