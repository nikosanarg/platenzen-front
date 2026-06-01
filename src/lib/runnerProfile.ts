import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';

export interface RunnerProfile {
  id: string;
  label: string;
  subtitle: string;
}

const RUNNING_SPORTS = new Set(['Run', 'TrailRun', 'VirtualRun']);

export function computeRunnerProfile(
  activities: StravaActivity[],
  stats: ProcessedStats
): RunnerProfile | null {
  const runs = activities.filter(a => RUNNING_SPORTS.has(a.sport_type || a.type));
  if (runs.length < 5) return null;

  let weekendRuns = 0;
  for (const a of runs) {
    const [yr, mo, da] = a.start_date_local.slice(0, 10).split('-').map(Number);
    const day = new Date(yr, mo - 1, da).getDay();
    if (day === 0 || day === 6) weekendRuns++;
  }
  const weekendRatio = weekendRuns / runs.length;

  const longRuns = runs.filter(a => a.distance >= 15000).length;
  const longRatio = longRuns / runs.length;

  const trailRuns = runs.filter(a => (a.sport_type || a.type) === 'TrailRun').length;
  const trailRatio = trailRuns / runs.length;

  const recent12 = stats.weekly.slice(-12);
  const activeWeeks = recent12.filter(w => w.count > 0).length;
  const isConsistent = activeWeeks >= 9;

  const isHighVolume = stats.weeklyAvgDistance >= 40;

  if (trailRatio >= 0.4) {
    return { id: 'trail', label: 'Corredor de montaña', subtitle: 'El terreno irregular es tu hábitat' };
  }
  if (weekendRatio >= 0.65 && !isConsistent) {
    return { id: 'weekend', label: 'Corredor de fin de semana', subtitle: 'Aprovechás los días libres para entrenar' };
  }
  if (isHighVolume && longRatio >= 0.25) {
    return { id: 'fondo', label: 'Especialista en fondo', subtitle: 'Las distancias largas son tu terreno' };
  }
  if (isConsistent && isHighVolume) {
    return { id: 'builder', label: 'Constructor de kilómetros', subtitle: 'Semana a semana acumulás volumen' };
  }
  if (isConsistent) {
    return { id: 'consistente', label: 'Corredor consistente', subtitle: 'La regularidad es tu mayor virtud' };
  }
  if (longRatio >= 0.3) {
    return { id: 'fondo', label: 'Especialista en fondo', subtitle: 'Las distancias largas son tu zona' };
  }
  return { id: 'urbano', label: 'Explorador urbano', subtitle: 'Cada salida es una nueva aventura' };
}
