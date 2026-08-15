/**
 * Orquesta la carga de actividades: cache fresca vs. red, token inválido,
 * fallas de Strava vs. fallas inesperadas, y el refresh manual que descarta
 * la cache. Se mockea la red (services/strava) y el storage (lib/cache): son
 * el borde externo del hook.
 */
import { act, renderHook } from '@testing-library/react';
import { useActivities } from '@/hooks/useActivities';
import { fetchAllActivities, StravaError } from '@/services/providers/strava/api';
import { saveCache, loadCache, isCacheFresh, clearCache } from '@/lib/cache';
import { activity } from '@/__tests__/helpers/activity';

jest.mock('@/services/providers/strava/api', () => {
  const actual = jest.requireActual('@/services/providers/strava/api');
  return { ...actual, fetchAllActivities: jest.fn() };
});
jest.mock('@/lib/cache');

const mockedFetchAll = fetchAllActivities as jest.Mock;
const mockedLoadCache = loadCache as jest.Mock;
const mockedIsCacheFresh = isCacheFresh as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('fetch', () => {
  it('usa la cache fresca sin llamar a la API', async () => {
    const cached = { activities: [activity()], timestamp: Date.now() - 1000, version: 1 };
    mockedLoadCache.mockReturnValue(cached);
    mockedIsCacheFresh.mockReturnValue(true);

    const { result } = renderHook(() => useActivities());
    await act(async () => {
      await result.current.fetch(jest.fn());
    });

    expect(result.current.status).toBe('success');
    expect(result.current.isFromCache).toBe(true);
    expect(result.current.activities).toEqual(cached.activities);
    expect(result.current.cacheAge).not.toBeNull();
    expect(mockedFetchAll).not.toHaveBeenCalled();
  });

  it('token inválido deja el hook en estado de error', async () => {
    mockedLoadCache.mockReturnValue(null);
    const getToken = jest.fn().mockResolvedValue(null);

    const { result } = renderHook(() => useActivities());
    await act(async () => {
      await result.current.fetch(getToken);
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('Token inválido o expirado. Ingresá un nuevo token.');
    expect(mockedFetchAll).not.toHaveBeenCalled();
  });

  it('carga actividades, reporta progreso y guarda en cache', async () => {
    mockedLoadCache.mockReturnValue(null);
    const acts = [activity()];
    mockedFetchAll.mockImplementation(async (_token: string, onProgress?: (n: number) => void) => {
      onProgress?.(acts.length);
      return acts;
    });

    const { result } = renderHook(() => useActivities());
    await act(async () => {
      await result.current.fetch(jest.fn().mockResolvedValue('tok'));
    });

    expect(result.current.status).toBe('success');
    expect(result.current.activities).toEqual(acts);
    expect(result.current.loadingCount).toBe(1);
    expect(result.current.isFromCache).toBe(false);
    expect(saveCache).toHaveBeenCalledWith(acts);
  });

  it('un StravaError se muestra con su propio mensaje', async () => {
    mockedLoadCache.mockReturnValue(null);
    mockedFetchAll.mockRejectedValue(new StravaError(403, 'scope_missing'));

    const { result } = renderHook(() => useActivities());
    await act(async () => {
      await result.current.fetch(jest.fn().mockResolvedValue('tok'));
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('scope_missing');
  });

  it('un error inesperado usa un mensaje genérico', async () => {
    mockedLoadCache.mockReturnValue(null);
    mockedFetchAll.mockRejectedValue(new Error('falla de red desconocida'));

    const { result } = renderHook(() => useActivities());
    await act(async () => {
      await result.current.fetch(jest.fn().mockResolvedValue('tok'));
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('Error inesperado al cargar actividades.');
  });
});

describe('refresh', () => {
  it('limpia la cache y fuerza la recarga aunque haya cache fresca', async () => {
    mockedLoadCache.mockReturnValue({ activities: [activity()], timestamp: Date.now(), version: 1 });
    mockedIsCacheFresh.mockReturnValue(true);
    const acts = [activity({ id: 2 })];
    mockedFetchAll.mockResolvedValue(acts);

    const { result } = renderHook(() => useActivities());
    await act(async () => {
      await result.current.refresh(jest.fn().mockResolvedValue('tok'));
    });

    expect(clearCache).toHaveBeenCalledTimes(1);
    expect(mockedFetchAll).toHaveBeenCalledTimes(1);
    expect(result.current.activities).toEqual(acts);
    expect(result.current.isFromCache).toBe(false);
  });
});
