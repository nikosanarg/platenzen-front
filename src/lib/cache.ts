import { CacheData } from '@/types/cache';
import { Activity } from '@/types/activity';

const CACHE_KEY = 'platenzen_activities_cache';
// v2: las actividades cacheadas antes de esto no tienen `provider`/`externalId`
// (identidad del contrato canónico). Subir la versión descarta ese formato
// viejo en vez de dejar que mergeActivities colapse todo en una sola fila
// bajo la clave `undefined:undefined`.
const CACHE_VERSION = 2;
const CACHE_TTL_MS = 6 * 24 * 60 * 60 * 1000;
/**
 * A partir de cuándo una cache todavía válida se considera vieja para mostrarla
 * sin más: al entrar, se vuelve a pedir a Strava. Son dos umbrales distintos y
 * no hay que confundirlos: `CACHE_TTL_MS` es cuánto se PUEDE conservar el dato
 * (tope de los términos de Strava), y esto es cuánto se CONFÍA en él. Lo
 * segundo es lo que evita que el dashboard muestre horas o días de atraso como
 * si fuera el estado actual.
 */
const AUTO_REFRESH_MS = 60 * 60 * 1000;

export function saveCache(activities: Activity[]): void {
  const data: CacheData = {
    activities,
    timestamp: Date.now(),
    version: CACHE_VERSION,
  };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Storage quota exceeded — silently skip
  }
}

export function loadCache(): CacheData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as CacheData;
    if (data.version !== CACHE_VERSION) return null;
    return data;
  } catch {
    return null;
  }
}

export function isCacheFresh(cache: CacheData): boolean {
  return Date.now() - cache.timestamp < CACHE_TTL_MS;
}

export function necesitaActualizar(cache: CacheData): boolean {
  return Date.now() - cache.timestamp >= AUTO_REFRESH_MS;
}

export function clearCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // Ignore
  }
}
