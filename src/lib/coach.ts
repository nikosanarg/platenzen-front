import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';

const RUNNING_SPORTS = new Set(['Run', 'TrailRun', 'VirtualRun']);
const DECAY = 0.9; // per day — 21 km today vs 19.1 km "effective" yesterday

export type LoadState = 'alta' | 'moderada' | 'normal' | 'baja' | 'sin datos';
export type RecommendationType = 'descanso' | 'regenerativa' | 'normal' | 'larga' | 'tempo' | 'velocidad';

export interface CoachRecommendation {
  type: RecommendationType;
  label: string;         // e.g. "Descanso activo o salida regenerativa de 4–6 km"
  loadState: LoadState;
  loadStateLabel: string; // e.g. "Carga alta"
  motivo: string[];      // bullet lines shown under "Motivo:"
  variables: {
    weightedLoad: number;
    baselineKm: number;
    loadRatio: number | null;
    biggestRecentKm: number;
    biggestRecentDaysAgo: number;
    daysSinceLastRun: number;
  };
}

const TYPE_LABELS: Record<RecommendationType, string> = {
  descanso: 'Descanso activo o salida regenerativa de 4–6 km',
  regenerativa: 'Salida regenerativa entre 5 y 8 km',
  normal: 'Salida normal a ritmo cómodo',
  larga: 'Salida larga',
  tempo: 'Entrenamiento de ritmo',
  velocidad: 'Entrenamiento de velocidad',
};

const LOAD_LABELS: Record<LoadState, string> = {
  alta: 'Carga alta',
  moderada: 'Carga moderada-alta',
  normal: 'Carga normal',
  baja: 'Carga baja',
  'sin datos': 'Sin datos suficientes',
};

function getRuns(activities: StravaActivity[]): StravaActivity[] {
  return activities.filter(a => RUNNING_SPORTS.has(a.sport_type || a.type) && a.distance > 0 && a.moving_time > 0);
}

function computeWeightedLoad(runs: StravaActivity[]): {
  load: number;
  biggestKm: number;
  biggestDaysAgo: number;
  daysSinceLast: number;
} {
  const now = Date.now();
  let load = 0;
  let biggestKm = 0;
  let biggestDaysAgo = 0;
  let lastTs = 0;

  for (const a of runs) {
    const ts = new Date(a.start_date_local).getTime();
    const daysAgo = (now - ts) / 86400000;
    if (daysAgo > 14) continue;

    const km = a.distance / 1000;
    const weight = Math.pow(DECAY, daysAgo);
    load += km * weight;

    if (ts > lastTs) lastTs = ts;

    // Track biggest notable run in last 7 days
    if (daysAgo <= 7 && km > biggestKm) {
      biggestKm = km;
      biggestDaysAgo = daysAgo;
    }
  }

  const daysSinceLast = lastTs > 0 ? (now - lastTs) / 86400000 : 999;
  return { load, biggestKm, biggestDaysAgo, daysSinceLast };
}

function computeBaseline(stats: ProcessedStats): number {
  const recent8 = stats.weekly.slice(-9, -1);
  if (recent8.length === 0) return 0;
  return recent8.reduce((s, w) => s + w.distance, 0) / recent8.length;
}

function fmtDaysAgo(daysAgo: number): string {
  const h = Math.round(daysAgo * 24);
  if (h < 2) return 'hace menos de 2 horas';
  if (h < 24) return `hace ${h} horas`;
  if (daysAgo < 2) return 'ayer';
  return `hace ${Math.round(daysAgo)} días`;
}

export function computeCoachRecommendation(
  activities: StravaActivity[],
  stats: ProcessedStats
): CoachRecommendation {
  const runs = getRuns(activities);

  const { load, biggestKm, biggestDaysAgo, daysSinceLast } = computeWeightedLoad(runs);
  const baselineKm = computeBaseline(stats);

  const variables = {
    weightedLoad: Math.round(load * 10) / 10,
    baselineKm: Math.round(baselineKm * 10) / 10,
    loadRatio: baselineKm > 0 ? Math.round((load / baselineKm) * 100) / 100 : null,
    biggestRecentKm: Math.round(biggestKm * 10) / 10,
    biggestRecentDaysAgo: Math.round(biggestDaysAgo * 10) / 10,
    daysSinceLastRun: Math.round(daysSinceLast),
  };

  function make(type: RecommendationType, loadState: LoadState, motivo: string[]): CoachRecommendation {
    return {
      type,
      label: TYPE_LABELS[type],
      loadState,
      loadStateLabel: LOAD_LABELS[loadState],
      motivo,
      variables,
    };
  }

  // No data
  if (runs.length === 0) {
    return make('normal', 'sin datos', ['No hay actividades registradas. Empezá a correr para obtener recomendaciones personalizadas.']);
  }

  // No baseline (very new runner)
  if (baselineKm < 1) {
    return make('normal', 'sin datos', ['Estás en las primeras semanas de entrenamiento. Salí a ritmo cómodo y disfrutá el proceso.']);
  }

  const ratio = load / baselineKm;
  const volumeChangePct = Math.round((ratio - 1) * 100);
  const sign = volumeChangePct > 0 ? '+' : '';

  // Build motivo bullets
  const motivo: string[] = [];

  if (Math.abs(volumeChangePct) >= 5) {
    motivo.push(`${sign}${volumeChangePct}% carga ponderada respecto al bloque anterior.`);
  }
  if (biggestKm >= 12) {
    motivo.push(`${biggestKm.toFixed(1)} km completados ${fmtDaysAgo(biggestDaysAgo)}.`);
  }

  // Ran today
  if (daysSinceLast < 0.5) {
    motivo.unshift('Corriste hoy.');
    return make('descanso', 'alta', motivo);
  }

  // Decision tree based on load ratio
  if (ratio > 1.5) {
    if (motivo.length === 0) motivo.push(`Carga acumulada en las últimas ${Math.ceil(ratio * 7)} días elevada.`);
    return make('descanso', 'alta', motivo);
  }

  if (ratio > 1.2) {
    if (motivo.length === 0) motivo.push('Carga de entrenamiento por encima del bloque de referencia.');
    return make('regenerativa', 'moderada', motivo);
  }

  if (daysSinceLast >= 6) {
    motivo.push(`${Math.round(daysSinceLast)} días sin correr.`);
    return make('normal', 'baja', motivo);
  }

  if (ratio < 0.6 && daysSinceLast >= 2) {
    if (motivo.length === 0) motivo.push('Carga baja en los últimos días.');
    const avgWeekly = stats.weeklyAvgDistance;
    return avgWeekly >= 25
      ? make('larga', 'baja', motivo)
      : make('normal', 'baja', motivo);
  }

  if (ratio >= 0.8 && ratio <= 1.2 && daysSinceLast >= 2 && stats.weeklyAvgDistance >= 30) {
    if (motivo.length === 0) motivo.push('Carga equilibrada y cuerpo descansado.');
    return make('tempo', 'normal', motivo);
  }

  if (motivo.length === 0) motivo.push('Carga de entrenamiento dentro del rango habitual.');
  return make('normal', 'normal', motivo);
}
