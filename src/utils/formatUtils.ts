// Utilidades para formateo

export function formatBytes(n: number): string {
  n = +n || 0;
  const KB = 1024;
  const MB = KB * 1024;
  const GB = MB * 1024;
  if (n >= GB) return (n / GB).toFixed(2) + ' GB';
  if (n >= MB) return (n / MB).toFixed(2) + ' MB';
  if (n >= KB) return (n / KB).toFixed(2) + ' KB';
  return n + ' B';
}

export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

export function toPingNumber(raw: string | number | null): number {
  if (typeof raw === 'number') return raw;
  const m = String(raw || '').match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : NaN;
}

export function pingClass(p: number): string {
  if (!Number.isFinite(p) || p <= 0) return 'ping--bad';
  if (p <= 200) return 'ping--good';
  if (p <= 500) return 'ping--warn';
  return 'ping--bad';
}

export function formatProtocol(rawMode?: string | null): string {
  const mode = (rawMode || '').trim();
  if (!mode) return '';
  const upper = mode.toUpperCase();
  const base = upper.split('_')[0] || upper;
  switch (base) {
    case 'V2RAY':
      return 'V2Ray';
    case 'SSR':
      return 'SSR';
    case 'SSH':
    case 'SSL':
    case 'UDP':
    case 'TCP':
    case 'HTTP':
    case 'KCP':
      return base;
    default:
      return base.charAt(0) + base.slice(1).toLowerCase();
  }
}
