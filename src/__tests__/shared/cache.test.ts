/**
 * El cache es lo que evita reprocesar el historial completo en cada visita y lo
 * que mantiene al repo dentro de los límites de la API de Strava. El TTL de 6
 * días no es arbitrario: es el máximo que permiten los términos de Strava.
 */
import { clearCache, isCacheFresh, loadCache, necesitaActualizar, saveCache } from '@/lib/cache';
import { CacheData } from '@/types/cache';
import { activity } from '@/__tests__/helpers/activity';

const SIX_DAYS_MS = 6 * 24 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

beforeEach(() => {
  localStorage.clear();
  jest.restoreAllMocks();
});

describe('saveCache / loadCache', () => {
  it('guarda y recupera las actividades con timestamp y versión', () => {
    const acts = [activity({ id: 7, distance: 5000 })];
    saveCache(acts);

    const loaded = loadCache();
    expect(loaded).not.toBeNull();
    expect(loaded!.activities).toEqual(acts);
    expect(loaded!.version).toBe(2);
    expect(typeof loaded!.timestamp).toBe('number');
  });

  it('devuelve null cuando no hay nada guardado', () => {
    expect(loadCache()).toBeNull();
  });

  it('descarta el cache de una versión distinta en lugar de leerlo mal', () => {
    const stale: CacheData = { activities: [activity()], timestamp: Date.now(), version: 99 };
    localStorage.setItem('platenzen_activities_cache', JSON.stringify(stale));

    expect(loadCache()).toBeNull();
  });

  it('devuelve null si el contenido guardado no es JSON válido', () => {
    localStorage.setItem('platenzen_activities_cache', '{roto');

    expect(loadCache()).toBeNull();
  });

  it('no propaga el error si el storage está lleno', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => saveCache([activity()])).not.toThrow();
  });
});

describe('isCacheFresh', () => {
  const at = (ageMs: number): CacheData => ({
    activities: [],
    timestamp: Date.now() - ageMs,
    version: 2,
  });

  it('considera fresco lo guardado hace menos de 6 días', () => {
    expect(isCacheFresh(at(0))).toBe(true);
    expect(isCacheFresh(at(SIX_DAYS_MS - 60_000))).toBe(true);
  });

  it('considera vencido lo que llegó a los 6 días', () => {
    expect(isCacheFresh(at(SIX_DAYS_MS))).toBe(false);
    expect(isCacheFresh(at(SIX_DAYS_MS + 60_000))).toBe(false);
  });
});

describe('necesitaActualizar', () => {
  const at = (ageMs: number): CacheData => ({
    activities: [],
    timestamp: Date.now() - ageMs,
    version: 2,
  });

  it('no pide actualizar lo guardado hace menos de una hora', () => {
    expect(necesitaActualizar(at(0))).toBe(false);
    expect(necesitaActualizar(at(ONE_HOUR_MS - 60_000))).toBe(false);
  });

  it('pide actualizar desde la hora exacta', () => {
    expect(necesitaActualizar(at(ONE_HOUR_MS))).toBe(true);
    expect(necesitaActualizar(at(ONE_HOUR_MS + 60_000))).toBe(true);
  });

  it('es independiente del tope de 6 días: una cache de 2 horas es válida pero vieja', () => {
    const dosHoras = at(2 * ONE_HOUR_MS);

    expect(isCacheFresh(dosHoras)).toBe(true);
    expect(necesitaActualizar(dosHoras)).toBe(true);
  });
});

describe('clearCache', () => {
  it('borra lo guardado', () => {
    saveCache([activity()]);
    clearCache();

    expect(loadCache()).toBeNull();
  });

  it('no propaga el error si el storage falla', () => {
    jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    expect(() => clearCache()).not.toThrow();
  });
});
