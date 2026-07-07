import { StravaActivity } from '@/types/strava';
import { CORE_DISTANCES } from '@/lib/distances';

const RUNNING_SPORTS = new Set(['Run', 'TrailRun', 'VirtualRun']);

export interface CoreRecord {
  /** Short label of the core distance, e.g. "21K". */
  label: string;
  distanceKm: number;
  /** Best projected time (seconds) achieved at that distance. */
  timeSeconds: number;
}

/**
 * The hero record: among the core race distances (5K, 10K, 21K, 42K, 100K),
 * take the one with the highest kilometrage the runner has actually reached,
 * and report their best projected time at it.
 *
 * Reaching a distance means completing a single activity of at least that
 * exact distance (marathon = 42.195 km, half = 21.0975 km).
 */
export function computeCoreRecord(activities: StravaActivity[]): CoreRecord | null {
  const runs = activities.filter(
    (a) =>
      RUNNING_SPORTS.has(a.sport_type || a.type) &&
      a.moving_time > 0 &&
      a.distance > 0
  );
  if (runs.length === 0) return null;

  const maxDistanceM = runs.reduce((m, a) => Math.max(m, a.distance), 0);

  // Highest core distance actually reached (CORE_DISTANCES is ascending).
  let core = null;
  for (const c of CORE_DISTANCES) {
    if (maxDistanceM >= c.meters) core = c;
  }
  if (!core) return null;

  // Best (fastest) projected time among activities that reached the distance.
  let best = Infinity;
  for (const a of runs) {
    if (a.distance < core.meters) continue;
    const projected = (core.meters / a.distance) * a.moving_time;
    if (projected < best) best = projected;
  }
  if (best === Infinity) return null;

  return { label: core.label, distanceKm: core.km, timeSeconds: Math.round(best) };
}
