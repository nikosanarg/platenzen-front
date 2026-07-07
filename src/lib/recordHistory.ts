import { StravaActivity } from '@/types/strava';
import { mpsToSecPerKm } from '@/utils/pace';
import { HALF_MARATHON_KM, HALF_MARATHON_M } from '@/lib/distances';

const RUNNING_SPORTS = new Set(['Run', 'TrailRun', 'VirtualRun']);

export interface RecordEntry {
  date: string;
  projectedTimeSeconds: number;
  pace: number;
  activityId: number;
  activityName: string;
  improvementSeconds: number | null;
}

export interface DistanceHistory {
  label: string;
  distanceKm: number;
  targetM: number;
  minM: number;
  history: RecordEntry[];
  currentBest: RecordEntry | null;
}

function buildHistory(
  activities: StravaActivity[],
  minM: number,
  targetM: number
): RecordEntry[] {
  const eligible = activities
    .filter(
      a =>
        RUNNING_SPORTS.has(a.sport_type || a.type) &&
        a.distance >= minM &&
        a.moving_time > 0 &&
        a.average_speed > 0
    )
    .sort((a, b) => a.start_date_local.localeCompare(b.start_date_local));

  const history: RecordEntry[] = [];
  let best = Infinity;

  for (const act of eligible) {
    const projected = Math.round((targetM / act.distance) * act.moving_time);
    if (projected < best) {
      const prevTime = history.length > 0 ? history[history.length - 1].projectedTimeSeconds : null;
      history.push({
        date: act.start_date_local.slice(0, 10),
        projectedTimeSeconds: projected,
        pace: Math.round(mpsToSecPerKm(act.average_speed)),
        activityId: act.id,
        activityName: act.name,
        improvementSeconds: prevTime !== null ? Math.round(prevTime - projected) : null,
      });
      best = projected;
    }
  }

  return history;
}

export function computeRecordHistories(activities: StravaActivity[]): DistanceHistory[] {
  return [
    { label: '5K', distanceKm: 5, targetM: 5000, minM: 4000 },
    { label: '10K', distanceKm: 10, targetM: 10000, minM: 8500 },
    { label: '15K', distanceKm: 15, targetM: 15000, minM: 13000 },
    { label: '21K', distanceKm: HALF_MARATHON_KM, targetM: HALF_MARATHON_M, minM: 18000 },
  ].map(d => {
    const history = buildHistory(activities, d.minM, d.targetM);
    return {
      ...d,
      history,
      currentBest: history.length > 0 ? history[history.length - 1] : null,
    };
  });
}

export function formatRecordTime(seconds: number): string {
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function formatImprovement(seconds: number): string {
  const abs = Math.abs(seconds);
  if (abs < 60) return `${abs}"`;
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  return s > 0 ? `${m}' ${s}"` : `${m}'`;
}

export function shortDate(date: string): string {
  const [, mo, da] = date.split('-');
  const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${parseInt(da)} ${MONTHS[parseInt(mo) - 1]}`;
}
