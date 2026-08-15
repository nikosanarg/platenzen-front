import { Activity } from '@/types/activity';

/**
 * Factory de actividades para los tests. `Activity` tiene muchos campos
 * obligatorios y casi ningún test le importa más de tres, así que se declaran
 * sólo los relevantes y el resto sale de valores neutros.
 *
 * `average_speed` se deriva de distancia/tiempo si no se pasa explícito: son el
 * mismo dato en la API de Strava, y una fixture donde no coinciden produce
 * resultados que no se corresponden con ninguna actividad real.
 *
 * `externalId` deriva de `id` si no se pasa explícito, y `provider` por
 * defecto es `'strava'` — sigue siendo el único proveedor con datos reales
 * en los tests existentes.
 */
export function activity(overrides: Partial<Activity> = {}): Activity {
  const distance = overrides.distance ?? 10000;
  const movingTime = overrides.moving_time ?? 3000;
  const id = overrides.id ?? 1;

  return {
    id,
    provider: 'strava',
    externalId: String(id),
    name: 'Salida',
    type: 'Run',
    sport_type: 'Run',
    distance,
    moving_time: movingTime,
    elapsed_time: movingTime,
    total_elevation_gain: 0,
    start_date: '2026-01-01T10:00:00Z',
    start_date_local: '2026-01-01T07:00:00Z',
    average_speed: movingTime > 0 ? distance / movingTime : 0,
    max_speed: 0,
    kudos_count: 0,
    athlete_count: 1,
    ...overrides,
  };
}

/**
 * Corridas en días consecutivos hacia atrás desde `endDate` (inclusive).
 * Útil para rachas, volumen acumulado y ventanas de tiempo.
 */
export function runsEndingAt(
  endDate: string,
  count: number,
  overrides: Partial<Activity> = {},
): Activity[] {
  const end = new Date(`${endDate}T12:00:00Z`).getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  return Array.from({ length: count }, (_, i) => {
    const date = new Date(end - i * dayMs).toISOString();
    return activity({
      id: i + 1,
      start_date: date,
      start_date_local: date,
      ...overrides,
    });
  });
}
