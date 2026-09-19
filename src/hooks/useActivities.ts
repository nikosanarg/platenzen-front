'use client';

import { useState, useCallback } from 'react';
import { Activity } from '@/types/activity';
import { fetchAllActivities, StravaError } from '@/services/providers/strava/api';
import { toActivity } from '@/services/providers/strava/adapter';
import { saveCache, loadCache, isCacheFresh, clearCache } from '@/lib/cache';
import { isStravaMockMode } from '@/lib/authMode';
import { StravaActivity } from '@/types/strava';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface UseActivitiesResult {
  activities: Activity[];
  status: Status;
  error: string | null;
  loadingCount: number;
  isFromCache: boolean;
  cacheAge: number | null;
  fetch: (getToken: () => Promise<string | null>) => Promise<void>;
  refresh: (getToken: () => Promise<string | null>) => Promise<void>;
}

export function useActivities(): UseActivitiesResult {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [loadingCount, setLoadingCount] = useState(0);
  const [isFromCache, setIsFromCache] = useState(false);
  const [cacheAge, setCacheAge] = useState<number | null>(null);

  const load = useCallback(async (getToken: () => Promise<string | null>, forceRefresh: boolean) => {
    setError(null);

    // Antes que la cache y sin tocarla, ni para leer ni para escribir: si el
    // mock quedara guardado, al apagarlo se seguiría viendo el historial falso
    // durante los 6 días de vigencia de la cache, como si fuera el real.
    //
    // El `NODE_ENV` va inline aunque `isStravaMockMode` ya lo chequee: el
    // bundler reemplaza el literal y descarta la rama —y con ella el chunk de
    // la fixture— sólo si la condición está acá, a la vista. Adentro de la
    // función no la pliega, y la fixture (un volcado real de Strava, con
    // trazas GPS) quedaba publicada en `/_next/static` aunque nunca se cargara.
    if (process.env.NODE_ENV !== 'production' && isStravaMockMode()) {
      const { activitiesMock } = await import('@/__mocks__/activitiesMock');
      setActivities((activitiesMock as StravaActivity[]).map(toActivity));
      setIsFromCache(false);
      setCacheAge(null);
      setStatus('success');
      return;
    }

    if (!forceRefresh) {
      const cached = loadCache();
      if (cached && isCacheFresh(cached)) {
        setActivities(cached.activities);
        setIsFromCache(true);
        setCacheAge(Date.now() - cached.timestamp);
        setStatus('success');
        return;
      }
    }

    setStatus('loading');
    setLoadingCount(0);
    setIsFromCache(false);
    setCacheAge(null);

    const token = await getToken();
    if (!token) {
      setError('Token inválido o expirado. Ingresá un nuevo token.');
      setStatus('error');
      return;
    }

    try {
      const raw = await fetchAllActivities(token, (count) => {
        setLoadingCount(count);
      });
      const result = raw.map(toActivity);
      saveCache(result);
      setActivities(result);
      setStatus('success');
    } catch (err) {
      if (err instanceof StravaError) {
        setError(err.message);
      } else {
        setError('Error inesperado al cargar actividades.');
      }
      setStatus('error');
    }
  }, []);

  const fetch = useCallback(
    (getToken: () => Promise<string | null>) => load(getToken, false),
    [load]
  );

  const refresh = useCallback(
    (getToken: () => Promise<string | null>) => {
      // En mock, "Actualizar" no puede borrar la cache: es la del historial
      // real, que tiene que seguir ahí cuando se apague el mock.
      if (!isStravaMockMode()) clearCache();
      return load(getToken, true);
    },
    [load]
  );

  return { activities, status, error, loadingCount, isFromCache, cacheAge, fetch, refresh };
}
