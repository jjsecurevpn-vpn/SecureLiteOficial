// Centraliza la interacción con el bridge nativo DT

import type { DtApiName, NativeBridge } from '../types/native';

type DtCallable = (...args: unknown[]) => unknown;

interface DtApi {
  execute?: DtCallable;
  set?: (value: unknown) => void;
}

function getApi(name: DtApiName): DtApi | null {
  try {
    const api = (window as unknown as Record<string, unknown>)[name];
    if (api && typeof api === 'object') return api as DtApi;
    if (typeof api === 'function') return { execute: api as DtCallable };
  } catch (error) {
    console.error('bridge error', name, error);
  }
  return null;
}

export const dt: NativeBridge = {
  call<T = unknown>(name: DtApiName, ...args: unknown[]): T | null {
    try {
      const api = getApi(name);
      if (!api) return null;
      if (typeof api.execute === 'function') return api.execute(...args) as T;
    } catch (error) {
      console.error('bridge call', name, error);
    }
    return null;
  },

  set(name: DtApiName, value: unknown): void {
    try {
      const api = getApi(name);
      if (!api) return;
      if (typeof api.set === 'function') {
        api.set(value);
      } else if (typeof api.execute === 'function') {
        api.execute(value);
      }
    } catch (error) {
      console.error('bridge set', name, error);
    }
  },

  get jsonConfigAtual() {
    const c = this.call<string>('DtGetDefaultConfig');
    if (!c) return null;
    try {
      return typeof c === 'string' ? JSON.parse(c) : c;
    } catch {
      return null;
    }
  },
};

/**
 * Intenta ejecutar la primera API disponible de una lista de candidatos
 * Útil para APIs con múltiples nombres según versión de la app
 */
export function callOne(candidates: DtApiName[], ...args: unknown[]): boolean {
  for (const name of candidates) {
    const api = getApi(name);
    if (api && typeof api.execute === 'function') {
      dt.call(name, ...args);
      return true;
    }
  }
  return false;
}

/** Obtiene versiones de config y app */
export function getAppVersions(): string {
  const vCfg = dt.call<string>('DtGetLocalConfigVersion') || '-';
  const vApp = dt.call<string>('DtAppVersion') || '-';
  return `${vCfg}/${vApp}`;
}

/** Obtiene el nombre del operador de red */
export function getOperator(): string {
  return dt.call<string>('DtGetNetworkName') || '—';
}

export function getBestIP(config?: { ip?: string }): string {
  const local = dt.call<string>('DtGetLocalIP');
  const ip = local || dt.jsonConfigAtual?.ip || config?.ip || '—';
  const match = String(ip).match(/(\d{1,3}(?:\.\d{1,3}){3})/);
  return match ? match[1] : String(ip);
}

export function getLogs(): string {
  try {
    return (window as { DtGetLogs?: { execute: () => string } }).DtGetLogs?.execute() || 'Nenhum log';
  } catch {
    return 'Nenhum log';
  }
}

export function parseLogs(raw: string): string {
  try {
    const arr = JSON.parse(raw);
    return arr
      .map((entry: Record<string, string>) => {
        const key = Object.keys(entry)[0];
        return `[${key}] ${entry[key].replace(/<[^>]*>/g, '')}`;
      })
      .join('\n');
  } catch {
    return raw;
  }
}

const NATIVE_EVENT_NAMES = [
  'DtVpnStateEvent',
  'DtCheckUserResultEvent',
  'DtCheckUserModelEvent',
  'DtConfigSelectedEvent',
  'DtNewDefaultConfigEvent',
  'DtCheckUserStartedEvent',
] as const;

export type NativeEventName = (typeof NATIVE_EVENT_NAMES)[number];

type NativeHandler = (payload: unknown) => void;

const listenerMap = new Map<NativeEventName, Set<NativeHandler>>();
let initialized = false;

function dispatchEvent(name: NativeEventName, payload: unknown) {
  const listeners = listenerMap.get(name);
  if (!listeners || !listeners.size) return;
  listeners.forEach(handler => {
    queueMicrotask(() => {
      try {
        handler(payload);
      } catch (error) {
        console.error(`Error al manejar ${name}`, error);
      }
    });
  });
}

export function initNativeEvents() {
  if (initialized || typeof window === 'undefined') return;
  const win = window as unknown as Record<string, unknown>;

  NATIVE_EVENT_NAMES.forEach(name => {
    const previous = win[name];
    const proxy: NativeHandler = payload => {
      dispatchEvent(name, payload);
    };

    if (typeof previous === 'function') {
      const original = previous as DtCallable;
      win[name] = (payload: unknown) => {
        try {
          original(payload);
        } finally {
          proxy(payload);
        }
      };
    } else {
      win[name] = proxy;
    }
  });

  initialized = true;
}

export function onNativeEvent<T = unknown>(name: NativeEventName, handler: (payload: T) => void) {
  if (!initialized) initNativeEvents();
  if (!listenerMap.has(name)) listenerMap.set(name, new Set());
  listenerMap.get(name)!.add(handler as NativeHandler);
  return () => {
    const listeners = listenerMap.get(name);
    if (!listeners) return;
    listeners.delete(handler as NativeHandler);
    if (!listeners.size) listenerMap.delete(name);
  };
}
