import { useCallback, useEffect, useRef, useState } from 'react';
import type { Credentials, ServerConfig, UserInfo, VpnStatus } from '../../types';
import { toPingNumber } from '../../utils/formatUtils';
import { dt, getAppVersions, getBestIP, getOperator, onNativeEvent } from '../../services/vpnBridge';

interface UseVpnUserStateArgs {
  status: VpnStatus;
  config: ServerConfig | null;
  creds: Credentials;
}

interface UseVpnUserState {
  user: UserInfo | null;
  topInfo: { op: string; ip: string; ver: string };
  pingMs: number | null;
}

export function useVpnUserState({ status, config, creds }: UseVpnUserStateArgs): UseVpnUserState {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [topInfo, setTopInfo] = useState({ op: '—', ip: '—', ver: '-' });
  const [pingMs, setPingMs] = useState<number | null>(null);
  const userFetchRef = useRef({ pending: false, lastAt: 0 });

  const updateTopInfo = useCallback(() => {
    setTopInfo({
      op: getOperator(),
      ip: getBestIP(config || undefined),
      ver: getAppVersions(),
    });
  }, [config]);

  const refreshPing = useCallback(() => {
    const raw = dt.call<string | number>('DtGetPingResult');
    const parsed = toPingNumber(raw ?? null);
    if (Number.isFinite(parsed)) {
      setPingMs(prev => (prev === parsed ? prev : parsed));
    } else {
      setPingMs(null);
    }
  }, []);

  const handleUserData = useCallback((dataInput: unknown) => {
    try {
      const parsed = typeof dataInput === 'string' ? JSON.parse(dataInput) : dataInput;
      if (!parsed || typeof parsed !== 'object') return;
      const payload = parsed as Record<string, unknown>;

      const pick = (keys: string[], fallback?: unknown) => {
        for (const key of keys) {
          const value = payload[key];
          if (value !== undefined && value !== null && value !== '') return value;
        }
        return fallback;
      };

      const username = pick(['username', 'user', 'name'], creds.user || 'usuario');
      const expirationDate = pick(['expiration_date', 'expirationDate', 'expire_date']);
      const limitConnections = pick(['limit_connections', 'limitConnections', 'max_connections']);
      const countConnections = pick(['count_connections', 'countConnections', 'connections']);

      setUser(prev => ({
        name: String(username ?? prev?.name ?? creds.user ?? 'usuario'),
        expiration_date: String(expirationDate ?? prev?.expiration_date ?? '-'),
        limit_connections: String(limitConnections ?? prev?.limit_connections ?? '-'),
        count_connections: Number(countConnections ?? prev?.count_connections ?? 0) || 0,
      }));

      userFetchRef.current.pending = false;
      userFetchRef.current.lastAt = Date.now();
    } catch (error) {
      console.error('❌ Error parsing user data:', error);
      userFetchRef.current.pending = false;
    }
  }, [creds.user]);

  const requestUserInfo = useCallback((force = false) => {
    const now = Date.now();
    const { pending, lastAt } = userFetchRef.current;
    const recentlyFetched = now - lastAt < 5000;

    if (!force && (pending || recentlyFetched)) {
      return;
    }

    userFetchRef.current.pending = true;
    userFetchRef.current.lastAt = now;

    let resolved = false;

    const readDirect = () => {
      const raw = dt.call<string>('DtGetUserInfo');
      if (raw) {
        resolved = true;
        handleUserData(raw);
      } else {
        userFetchRef.current.pending = false;
      }
    };

    try {
      const win = window as unknown as Record<string, { execute?: () => void }>;
      const dtCheck = win.DtStartCheckUser;
      if (dtCheck?.execute) {
        dtCheck.execute();
        setTimeout(() => {
          if (!resolved) readDirect();
        }, 600);
        setTimeout(() => {
          if (!resolved) readDirect();
        }, 2000);
        return;
      }
    } catch (error) {
      console.warn('DtStartCheckUser no disponible directamente', error);
    }

    readDirect();
  }, [handleUserData]);

  useEffect(() => {
    const offUserResult = onNativeEvent('DtCheckUserResultEvent', handleUserData);
    const offUserModel = onNativeEvent('DtCheckUserModelEvent', handleUserData);

    return () => {
      offUserResult();
      offUserModel();
    };
  }, [handleUserData]);

  useEffect(() => {
    if (status === 'CONNECTED') {
      requestUserInfo(true);
    } else {
      setUser(null);
    }
  }, [status, requestUserInfo]);

  useEffect(() => {
    if (status !== 'CONNECTED') return undefined;
    if (user?.expiration_date && user.expiration_date !== '-') return undefined;

    const interval = setInterval(() => {
      requestUserInfo();
    }, 5000);
    return () => clearInterval(interval);
  }, [status, user?.expiration_date, requestUserInfo]);

  useEffect(() => {
    if (status !== 'CONNECTED') {
      setPingMs(null);
      return undefined;
    }
    refreshPing();
    const interval = setInterval(() => {
      refreshPing();
    }, 2000);
    return () => clearInterval(interval);
  }, [status, refreshPing]);

  useEffect(() => {
    updateTopInfo();
    const interval = setInterval(() => {
      updateTopInfo();
    }, 800);
    return () => clearInterval(interval);
  }, [updateTopInfo]);

  return {
    user,
    topInfo,
    pingMs,
  };
}
