'use client';

import React, { createContext, useContext } from 'react';
import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';

interface StravaData {
  activities: StravaActivity[];
  stats: ProcessedStats;
}

const StravaDataContext = createContext<StravaData | null>(null);

export const StravaDataProvider: React.FC<{
  value: StravaData;
  children: React.ReactNode;
}> = ({ value, children }) => (
  <StravaDataContext.Provider value={value}>{children}</StravaDataContext.Provider>
);

/**
 * Actividades y stats ya procesadas. Viven en el layout de las rutas del dashboard,
 * asi que sobreviven a la navegacion entre tabs: cambiar de tab no re-procesa el historial.
 */
export function useStravaData(): StravaData {
  const data = useContext(StravaDataContext);
  if (!data) {
    throw new Error('useStravaData requiere StravaDataProvider en un layout superior');
  }
  return data;
}
