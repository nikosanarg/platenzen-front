'use client';

import { useState, useCallback } from 'react';
import { StravaActivity } from '@/types/strava';
import { fetchAllActivities, StravaError } from '@/services/strava';
import { saveCache, loadCache, isCacheFresh, clearCache } from '@/lib/cache';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface UseActivitiesResult {
  activities: StravaActivity[];
  status: Status;
  error: string | null;
  loadingCount: number;
  isFromCache: boolean;
  cacheAge: number | null;
  fetch: (getToken: () => Promise<string | null>) => Promise<void>;
  refresh: (getToken: () => Promise<string | null>) => Promise<void>;
}

export function useActivities(): UseActivitiesResult {
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [loadingCount, setLoadingCount] = useState(0);
  const [isFromCache, setIsFromCache] = useState(false);
  const [cacheAge, setCacheAge] = useState<number | null>(null);

  const load = useCallback(async (getToken: () => Promise<string | null>, forceRefresh: boolean) => {
    setError(null);

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
      const result = await fetchAllActivities(token, (count) => {
        setLoadingCount(count);
      });
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
      clearCache();
      return load(getToken, true);
    },
    [load]
  );

  return { activities, status, error, loadingCount, isFromCache, cacheAge, fetch, refresh };
}
