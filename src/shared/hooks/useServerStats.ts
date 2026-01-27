import { useEffect, useMemo, useRef, useState } from 'react';
import type { ServersStatsResponse } from '../types';

const DEFAULT_STATS_URL = 'https://shop.jhservices.com.ar/api/realtime/snapshot';

export type UseServerStatsOptions = {
  url?: string;
  pollMs?: number;
  enabled?: boolean;
};

type ServerStatsState = {
  data: ServersStatsResponse | null;
  loading: boolean;
  error: string | null;
};

export function useServerStats(options: UseServerStatsOptions = {}) {
  const { url = DEFAULT_STATS_URL, pollMs = 30_000, enabled = true } = options;

  const [state, setState] = useState<ServerStatsState>({
    data: null,
    loading: true,
    error: null,
  });

  const lastUrlRef = useRef(url);
  if (lastUrlRef.current !== url) {
    lastUrlRef.current = url;
  }

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });

        if (!response.ok) {
          if (cancelled) return;
          setState((prev) => ({
            data: prev.data,
            loading: false,
            error: `HTTP ${response.status}`,
          }));
          return;
        }

        const json = (await response.json()) as any;
        if (cancelled) return;

        if (!json || !json.success || !json.data || !json.data.serverStats || !Array.isArray(json.data.serverStats.servers)) {
          setState((prev) => ({
            data: prev.data,
            loading: false,
            error: 'Respuesta inválida',
          }));
          return;
        }

        setState({ data: json.data.serverStats, loading: false, error: null });
      } catch (err) {
        if (cancelled) return;
        setState((prev) => ({
          data: prev.data,
          loading: false,
          error: err instanceof Error ? err.message : 'Error de red',
        }));
      }
    }

    load();
    const id = window.setInterval(load, pollMs);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [enabled, pollMs, url]);

  const serversByName = useMemo(() => {
    const normalize = (value: string) =>
      value
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const parseDesired = (raw: string) => {
      const n = normalize(raw);
      const isFree = n.includes('GRATUITO') || n.includes('FREE');
      const wantsBrasil = n.includes('BRASIL') || n.includes('BRAZIL') || /\bBR\b/.test(n);
      const wantsArgentina = n.includes('ARGENTINA') || /\bAR\b/.test(n);
      const wantsUsa = n.includes('USA') || n.includes('UNITED STATES') || /\bUS\b/.test(n);

      const wantsTwo = /\b2\b/.test(n) || n.endsWith(' 2') || n.endsWith('2') || n.includes(' II');
      const wantsOne = /\b1\b/.test(n) || n.endsWith(' 1') || n.endsWith('1') || n.includes(' I');
      const desiredNumber = wantsTwo ? 2 : wantsOne ? 1 : null;

      return {
        normalized: n,
        isFree,
        desiredNumber,
        wantsBrasil,
        wantsArgentina,
        wantsUsa,
      };
    };

    const map = new Map<string, ServersStatsResponse['servers'][number]>();
    const list = state.data?.servers || [];
    list.forEach((server) => {
      if (!server?.serverName) return;
      map.set(normalize(server.serverName), server);
    });

    const findByIncludes = (needles: string[]) => {
      const normalizedNeedles = needles.map(normalize);
      for (const server of list) {
        const name = normalize(server.serverName || '');
        if (!name) continue;
        if (normalizedNeedles.every((n) => name.includes(n))) return server;
      }
      return undefined;
    };

    const bestMatch = (name?: string | null) => {
      if (!name) return undefined;
      const desired = parseDesired(name);
      const n = desired.normalized;

      // 1) Match exacto (cuando el nombre del servidor en la app coincide con el del backend)
      const exact = map.get(n);
      if (exact) return exact;

      // 1.1) Scoring match: sirve cuando los nombres de la app son "categorías" y no coinciden 1:1
      if (list.length) {
        const scored = list
          .map((server) => {
            const serverName = normalize(server.serverName || '');
            const isFree = serverName.includes('GRATUITO');

            const hasBrasil = serverName.includes(' BR') || /\bBR\b/.test(serverName);
            const hasArgentina = serverName.includes(' AR') || /\bAR\b/.test(serverName);
            const hasUsa = serverName.includes('USA');

            const has1 = /\b1\b/.test(serverName);
            const has2 = /\b2\b/.test(serverName);

            let score = 0;

            // Preferir mismo tipo (premium vs gratuito)
            if (desired.isFree) {
              if (isFree) score += 8;
            } else {
              if (!isFree) score += 4;
            }

            // Región
            if (desired.wantsBrasil && hasBrasil) score += 10;
            if (desired.wantsArgentina && hasArgentina) score += 10;
            if (desired.wantsUsa && hasUsa) score += 6;

            // Número (1/2)
            if (desired.desiredNumber === 2 && has2) score += 6;
            if (desired.desiredNumber === 1 && has1) score += 4;

            // Bonus: tokens compartidos (fallback)
            const tokens = n.split(' ').filter(Boolean).slice(0, 4);
            for (const token of tokens) {
              if (token.length < 2) continue;
              if (serverName.includes(token)) score += 1;
            }

            return { server, score };
          })
          .sort((a, b) => b.score - a.score);

        const top = scored[0];
        // Umbral bajo: con región o gratuito normalmente sube mucho
        if (top && top.score >= 8) return top.server;
      }

      // 2) Heurísticas para nombres simplificados (categorías)
      // BRASIL / BRASIL 2 -> PREMIUM 1 BR / PREMIUM 2 BR
      if (n.includes('BRASIL') || n.includes('BRAZIL') || n.includes(' BR ')) {
        if (n.includes(' 2') || n.endsWith('2') || n.includes('II')) {
          return findByIncludes(['PREMIUM', '2', 'BR']) || findByIncludes(['2', 'BR']);
        }
        return findByIncludes(['PREMIUM', '1', 'BR']) || findByIncludes(['1', 'BR']) || findByIncludes(['BR']);
      }

      // ARGENTINA -> PREMIUM 1 AR
      if (n.includes('ARGENTINA') || n.includes(' AR ')) {
        return findByIncludes(['PREMIUM', '1', 'AR']) || findByIncludes(['1', 'AR']) || findByIncludes(['AR']);
      }

      // GRATUITO -> GRATUITO (ej: GRATUITO USA)
      if (n.includes('GRATUITO') || n.includes('FREE')) {
        return findByIncludes(['GRATUITO']);
      }

      // USA -> PREMIUM USA / GRATUITO USA
      if (n.includes('USA') || n.includes('UNITED STATES')) {
        return findByIncludes(['USA']);
      }

      // Fallback: match parcial por tokens
      const tokens = n.split(' ').filter(Boolean).slice(0, 3);
      if (tokens.length) {
        return findByIncludes(tokens);
      }

      return undefined;
    };

    return {
      getByDisplayName: (name?: string | null) => {
        if (!name) return undefined;
        return map.get(normalize(name));
      },
      getBestMatch: bestMatch,
    };
  }, [state.data]);

  return {
    ...state,
    serversByName,
  };
}
