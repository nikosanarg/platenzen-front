import { StravaActivity } from '@/types/strava';
import { WeeklyStats } from '@/types/stats';
import { metersToKm } from '@/utils/units';
import { mpsToSecPerKm } from '@/utils/pace';
import { HALF_MARATHON_M } from '@/lib/distances';

const RUNNING_SPORTS = new Set(['Run', 'TrailRun', 'VirtualRun']);

export interface PersonalRecordEntry {
  distanceKm: number;
  timeSeconds: number;
  projectedTimeSeconds: number;
  pace: number; // sec/km
  date: string;
  activityId: number;
  activityName: string;
}

export interface PersonalRecords {
  best5k: PersonalRecordEntry | null;
  best10k: PersonalRecordEntry | null;
  best21k: PersonalRecordEntry | null;
  longest: PersonalRecordEntry | null;
  bestElevation: {
    elevationM: number;
    distanceKm: number;
    date: string;
    activityId: number;
    activityName: string;
  } | null;
  bestWeek: { distanceKm: number; weekLabel: string } | null;
}

function findBestProjected(
  activities: StravaActivity[],
  minDistanceM: number,
  targetDistanceM: number
): PersonalRecordEntry | null {
  const eligible = activities.filter(
    (a) =>
      RUNNING_SPORTS.has(a.sport_type || a.type) &&
      a.distance >= minDistanceM &&
      a.moving_time > 0 &&
      a.average_speed > 0
  );
  if (eligible.length === 0) return null;

  let best: StravaActivity | null = null;
  let bestProjected = Infinity;

  for (const act of eligible) {
    const projected = (targetDistanceM / act.distance) * act.moving_time;
    if (projected < bestProjected) {
      bestProjected = projected;
      best = act;
    }
  }

  if (!best) return null;

  return {
    distanceKm: Math.round(metersToKm(best.distance) * 100) / 100,
    timeSeconds: best.moving_time,
    projectedTimeSeconds: Math.round(bestProjected),
    pace: Math.round(mpsToSecPerKm(best.average_speed)),
    date: best.start_date_local.slice(0, 10),
    activityId: best.id,
    activityName: best.name,
  };
}

export function computePersonalRecords(
  activities: StravaActivity[],
  weekly: WeeklyStats[]
): PersonalRecords {
  const running = activities.filter((a) => RUNNING_SPORTS.has(a.sport_type || a.type));

  let longest: PersonalRecordEntry | null = null;
  if (running.length > 0) {
    const act = running.reduce((p, c) => (c.distance > p.distance ? c : p));
    longest = {
      distanceKm: Math.round(metersToKm(act.distance) * 10) / 10,
      timeSeconds: act.moving_time,
      projectedTimeSeconds: act.moving_time,
      pace: act.average_speed > 0 ? Math.round(mpsToSecPerKm(act.average_speed)) : 0,
      date: act.start_date_local.slice(0, 10),
      activityId: act.id,
      activityName: act.name,
    };
  }

  let bestElevation: PersonalRecords['bestElevation'] = null;
  if (activities.length > 0) {
    const act = activities.reduce((p, c) =>
      c.total_elevation_gain > p.total_elevation_gain ? c : p
    );
    if (act.total_elevation_gain > 0) {
      bestElevation = {
        elevationM: Math.round(act.total_elevation_gain),
        distanceKm: Math.round(metersToKm(act.distance) * 10) / 10,
        date: act.start_date_local.slice(0, 10),
        activityId: act.id,
        activityName: act.name,
      };
    }
  }

  let bestWeek: PersonalRecords['bestWeek'] = null;
  if (weekly.length > 0) {
    const w = weekly.reduce((p, c) => (c.distance > p.distance ? c : p));
    bestWeek = { distanceKm: Math.round(w.distance * 10) / 10, weekLabel: w.label };
  }

  return {
    best5k: findBestProjected(activities, 4000, 5000),
    best10k: findBestProjected(activities, 8500, 10000),
    best21k: findBestProjected(activities, 18000, HALF_MARATHON_M),
    longest,
    bestElevation,
    bestWeek,
  };
}

export function formatProjectedTime(seconds: number): string {
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function timeAgo(date: string): string {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days < 7) return days === 1 ? 'hace 1 día' : `hace ${days} días`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return weeks === 1 ? 'hace 1 semana' : `hace ${weeks} semanas`;
  const months = Math.floor(days / 30);
  return months === 1 ? 'hace 1 mes' : `hace ${months} meses`;
}
