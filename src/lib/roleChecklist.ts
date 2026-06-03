import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';
import {
  DISTANCE_THRESHOLDS,
  SPEED_THRESHOLDS,
  EXPLORATION_THRESHOLDS,
  EXPLORATION_DISTINCT_PLACES,
  ACHIEVEMENT_THRESHOLDS,
  MILESTONE_KM,
} from '@/lib/roleThresholds';
import { decodePolyline } from '@/lib/polylineDecoder';

const RUNNING_SPORTS = new Set(['Run', 'TrailRun', 'VirtualRun']);

export interface NodeChecklistItem {
  label: string;
  passed: boolean;
}

export interface RoleNodeChecklist {
  items: NodeChecklistItem[];
}

function getRuns(activities: StravaActivity[]): StravaActivity[] {
  return activities.filter(a => RUNNING_SPORTS.has(a.sport_type || a.type));
}

function milestonesReached(runs: StravaActivity[]): Set<number> {
  const reached = new Set<number>();
  for (const a of runs) {
    const km = a.distance / 1000;
    for (const m of MILESTONE_KM) {
      if (km >= m) reached.add(m);
    }
  }
  return reached;
}

function fmtPace(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}/km`;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function countDistinctStartingPlaces(runs: StravaActivity[]): number {
  const places: [number, number][] = [];
  for (const run of runs) {
    const polyline = run.map?.summary_polyline;
    if (!polyline) continue;
    try {
      const coords = decodePolyline(polyline);
      if (coords.length === 0) continue;
      const [lat, lon] = coords[0];
      const isNear = places.some(([pLat, pLon]) => haversineKm(lat, lon, pLat, pLon) <= 0.5);
      if (!isNear) places.push([lat, lon]);
    } catch {
      continue;
    }
  }
  return places.length;
}

export type RoleNodeId =
  | 'amateur'
  | 'fondista' | 'ultrafondista' | 'maratonista'
  | 'corredor' | 'pasadista' | 'velocista'
  | 'explorador' | 'trotamundos' | 'conquistador'
  | 'competidor' | 'coleccionador' | 'medallista';

export function computeNodeChecklist(
  nodeId: RoleNodeId,
  activities: StravaActivity[],
  stats: ProcessedStats
): RoleNodeChecklist {
  const runs = getRuns(activities);
  const maxKm = runs.reduce((m, a) => Math.max(m, a.distance / 1000), 0);
  const avgWeeklyKm = stats.weeklyAvgDistance;
  const bestPaceSec = stats.bestPace;
  const trailRuns = runs.filter(a => (a.sport_type || a.type) === 'TrailRun');
  const trailRatio = runs.length > 0 ? trailRuns.length / runs.length : 0;
  const totalKm = stats.totalDistance;
  const totalActivities = stats.totalActivities;
  const milestones = milestonesReached(runs);
  const milestoneCount = milestones.size;

  const {
    fondista_weekly_km, fondista_longest_km,
    ultrafondista_weekly_km, ultrafondista_longest_km,
    maratonista_longest_km,
  } = DISTANCE_THRESHOLDS;
  const { pasadista_pace_sec, velocista_pace_sec } = SPEED_THRESHOLDS;
  const {
    trotamundos_trail_ratio, trotamundos_total_km,
    conquistador_trail_ratio, conquistador_total_km,
  } = EXPLORATION_THRESHOLDS;
  const { explorador_min_places, trotamundos_min_places, conquistador_min_places } = EXPLORATION_DISTINCT_PLACES;
  const distinctPlaces = countDistinctStartingPlaces(runs);
  const {
    competidor_min_activities,
    coleccionador_min_activities, coleccionador_min_milestones, coleccionador_min_total_km,
    medallista_min_activities, medallista_min_milestones, medallista_min_total_km,
  } = ACHIEVEMENT_THRESHOLDS;

  const CHECKLISTS: Record<RoleNodeId, NodeChecklistItem[]> = {
    amateur: [
      { label: 'Tener al menos 1 actividad de running registrada', passed: runs.length >= 1 },
    ],
    fondista: [
      { label: `Promedio semanal ≥ ${fondista_weekly_km} km`, passed: avgWeeklyKm >= fondista_weekly_km },
      { label: `O completar una salida de ${fondista_longest_km} km`, passed: maxKm >= fondista_longest_km },
    ],
    ultrafondista: [
      { label: `Promedio semanal ≥ ${ultrafondista_weekly_km} km`, passed: avgWeeklyKm >= ultrafondista_weekly_km },
      { label: `Completar una salida de ${ultrafondista_longest_km} km`, passed: maxKm >= ultrafondista_longest_km },
    ],
    maratonista: [
      { label: `Promedio semanal ≥ ${ultrafondista_weekly_km} km`, passed: avgWeeklyKm >= ultrafondista_weekly_km },
      { label: `Completar una salida de ${ultrafondista_longest_km} km`, passed: maxKm >= ultrafondista_longest_km },
      { label: `Completar una maratón completa (${maratonista_longest_km} km)`, passed: maxKm >= maratonista_longest_km },
    ],
    corredor: [
      { label: 'Tener al menos 1 actividad de running registrada', passed: runs.length >= 1 },
    ],
    pasadista: [
      { label: `Alcanzar ritmo menor a ${fmtPace(pasadista_pace_sec)} en alguna salida`, passed: bestPaceSec > 0 && bestPaceSec < pasadista_pace_sec },
    ],
    velocista: [
      { label: `Alcanzar ritmo menor a ${fmtPace(pasadista_pace_sec)} en alguna salida`, passed: bestPaceSec > 0 && bestPaceSec < pasadista_pace_sec },
      { label: `Alcanzar ritmo menor a ${fmtPace(velocista_pace_sec)} en alguna salida`, passed: bestPaceSec > 0 && bestPaceSec < velocista_pace_sec },
    ],
    explorador: [
      { label: `Salir desde ${explorador_min_places} lugares distintos (tolerancia 500 m)`, passed: distinctPlaces >= explorador_min_places },
    ],
    trotamundos: [
      { label: `${trotamundos_min_places} lugares distintos de inicio`, passed: distinctPlaces >= trotamundos_min_places },
      { label: `O acumular ${trotamundos_total_km} km en total`, passed: totalKm >= trotamundos_total_km },
      { label: `O el ${Math.round(trotamundos_trail_ratio * 100)}% de salidas en trail`, passed: trailRatio >= trotamundos_trail_ratio },
    ],
    conquistador: [
      { label: `${conquistador_min_places} lugares distintos de inicio`, passed: distinctPlaces >= conquistador_min_places },
      { label: `O acumular ${conquistador_total_km} km en total`, passed: totalKm >= conquistador_total_km },
      { label: `Con el ${Math.round(conquistador_trail_ratio * 100)}% de salidas en trail`, passed: trailRatio >= conquistador_trail_ratio },
    ],
    competidor: [
      { label: `Completar ${competidor_min_activities} actividades de running`, passed: totalActivities >= competidor_min_activities },
      { label: 'O desbloquear al menos 1 hito de distancia', passed: milestoneCount >= 1 },
    ],
    coleccionador: [
      { label: `Completar ${coleccionador_min_activities} actividades`, passed: totalActivities >= coleccionador_min_activities },
      { label: `Desbloquear ${coleccionador_min_milestones} hitos de distancia`, passed: milestoneCount >= coleccionador_min_milestones },
      { label: `Acumular ${coleccionador_min_total_km} km en total`, passed: totalKm >= coleccionador_min_total_km },
    ],
    medallista: [
      { label: `Completar ${medallista_min_activities} actividades`, passed: totalActivities >= medallista_min_activities },
      { label: `Desbloquear ${medallista_min_milestones} hitos (incluyendo media maratón)`, passed: milestoneCount >= medallista_min_milestones && milestones.has(21.1) },
      { label: `Acumular ${medallista_min_total_km} km en total`, passed: totalKm >= medallista_min_total_km },
    ],
  };

  return { items: CHECKLISTS[nodeId] };
}
