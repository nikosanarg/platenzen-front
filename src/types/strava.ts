/**
 * El payload crudo tal como lo devuelve la API de Strava. NO es el contrato
 * canónico del dominio — ese es `Activity` (`@/types/activity.ts`). Sólo el
 * cliente de Strava (`@/services/providers/strava/api.ts`) y su adapter
 * (`@/services/providers/strava/adapter.ts`) deberían importar esto.
 */
export interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  start_date: string;
  start_date_local: string;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  kudos_count: number;
  athlete_count: number;
  map?: {
    summary_polyline?: string;
  };
}

export interface StravaAthlete {
  id: number;
  firstname: string;
  lastname: string;
  profile: string;
  city: string;
  country: string;
}
