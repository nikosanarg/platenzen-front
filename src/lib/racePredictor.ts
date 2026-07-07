import { StravaActivity } from '@/types/strava';
import { HALF_MARATHON_KM, MARATHON_KM, formatKmExact } from '@/lib/distances';

const RUNNING_SPORTS = new Set(['Run', 'TrailRun', 'VirtualRun']);

// Riegel formula: T2 = T1 × (D2 / D1)^1.06
const RIEGEL_EXP = 1.06;

export interface RaceDistance {
  km: number;
  label: string;
}

export const RACE_DISTANCES: RaceDistance[] = [
  { km: 5, label: '5 km' },
  { km: 10, label: '10 km' },
  { km: 15, label: '15 km' },
  { km: HALF_MARATHON_KM, label: `${formatKmExact(HALF_MARATHON_KM)} km` },
  { km: 31.5, label: '31.5 km' },
  { km: MARATHON_KM, label: `${formatKmExact(MARATHON_KM)} km` },
];

export interface RacePredictionRow {
  distanceKm: number;
  label: string;
  bestSeconds: number | null; // best projected time from last 12 months
  bestDate: string | null;
  predictedSeconds: number | null; // Riegel prediction from best reference
}

function get12MonthRuns(activities: StravaActivity[]): StravaActivity[] {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  const cutoffMs = cutoff.getTime();
  return activities.filter(a => {
    const d = new Date(a.start_date_local).getTime();
    return d >= cutoffMs && RUNNING_SPORTS.has(a.sport_type || a.type) && a.moving_time > 0 && a.distance > 0;
  });
}

// For a target distance, find the run that gives the best (fastest) projected time
function findBestProjected(
  runs: StravaActivity[],
  targetKm: number,
  minKm: number
): { seconds: number; date: string } | null {
  const eligible = runs.filter(a => a.distance / 1000 >= minKm);
  if (eligible.length === 0) return null;

  let bestSeconds = Infinity;
  let bestDate = '';

  for (const a of eligible) {
    const projected = (targetKm / (a.distance / 1000)) * a.moving_time;
    if (projected < bestSeconds) {
      bestSeconds = projected;
      bestDate = a.start_date_local.slice(0, 10);
    }
  }

  return bestSeconds < Infinity ? { seconds: Math.round(bestSeconds), date: bestDate } : null;
}

// Find the "best reference" performance to anchor Riegel predictions
// Use the longest run that has a valid speed, as it gives the most conservative prediction
interface ReferencePerformance {
  distanceKm: number;
  timeSeconds: number;
}

function findBestReference(runs: StravaActivity[]): ReferencePerformance | null {
  if (runs.length === 0) return null;

  // Pick the run with the best average pace (most speed data), at least 5 km
  const eligible = runs.filter(a => a.distance >= 5000 && a.average_speed > 0);
  if (eligible.length === 0) return null;

  // Use the fastest pace run as the reference (gives most optimistic predictions)
  // Use the best projected 10km time from all runs as anchor
  let bestPaceRun: StravaActivity | null = null;
  let bestPace = 0;
  for (const a of eligible) {
    if (a.average_speed > bestPace) {
      bestPace = a.average_speed;
      bestPaceRun = a;
    }
  }

  if (!bestPaceRun) return null;
  return {
    distanceKm: bestPaceRun.distance / 1000,
    timeSeconds: bestPaceRun.moving_time,
  };
}

function riegelPredict(ref: ReferencePerformance, targetKm: number): number {
  return ref.timeSeconds * Math.pow(targetKm / ref.distanceKm, RIEGEL_EXP);
}

export function computeRacePredictions(activities: StravaActivity[]): RacePredictionRow[] {
  const runs = get12MonthRuns(activities);
  const ref = findBestReference(runs);

  // Min distance thresholds for "projected best time" at each target
  const minKmThresholds: Record<number, number> = {
    5: 4,
    10: 8.5,
    15: 13,
    [HALF_MARATHON_KM]: 18,
    31.5: 28,
    [MARATHON_KM]: 38,
  };

  return RACE_DISTANCES.map(({ km, label }) => {
    const projected = findBestProjected(runs, km, minKmThresholds[km] ?? km * 0.8);
    const predicted = ref ? Math.round(riegelPredict(ref, km)) : null;

    return {
      distanceKm: km,
      label,
      bestSeconds: projected?.seconds ?? null,
      bestDate: projected?.date ?? null,
      predictedSeconds: predicted,
    };
  });
}

export function formatRaceTime(seconds: number): string {
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function formatRaceDate(dateStr: string): string {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${d} ${months[mo - 1]} ${y}`;
}
