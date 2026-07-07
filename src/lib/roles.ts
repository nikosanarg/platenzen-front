import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';
import {
  DISTANCE_THRESHOLDS, DISTANCE_AFINIDAD,
  SPEED_THRESHOLDS, SPEED_AFINIDAD,
  EXPLORATION_THRESHOLDS, EXPLORATION_AFINIDAD, EXPLORATION_DISTINCT_PLACES,
  ACHIEVEMENT_THRESHOLDS, ACHIEVEMENT_AFINIDAD,
  MILESTONE_KM,
} from '@/lib/roleThresholds';
import { countDistinctStartingPlaces } from '@/lib/explorationUtils';
import { HALF_MARATHON_KM } from '@/lib/distances';

const RUNNING_SPORTS = new Set(['Run', 'TrailRun', 'VirtualRun']);

// ── Role definitions ───────────────────────────────────────────────────────

export type RoleBranchId = 'distance' | 'speed' | 'exploration' | 'achievement';
export type RoleObjective = 'maratonista' | 'velocista' | 'conquistador' | 'medallista';

export interface RoleDefinition {
  id: string;
  name: string;
  branch: RoleBranchId;
  level: number; // 0 = base, higher = more advanced
}

const DISTANCE_ROLES: RoleDefinition[] = [
  { id: 'amateur', name: 'Amateur', branch: 'distance', level: 0 },
  { id: 'fondista', name: 'Fondista', branch: 'distance', level: 1 },
  { id: 'ultrafondista', name: 'Ultrafondista', branch: 'distance', level: 2 },
  { id: 'maratonista', name: 'Maratonista', branch: 'distance', level: 3 },
];

const SPEED_ROLES: RoleDefinition[] = [
  { id: 'corredor', name: 'Corredor', branch: 'speed', level: 0 },
  { id: 'pasadista', name: 'Pasadista', branch: 'speed', level: 1 },
  { id: 'velocista', name: 'Velocista', branch: 'speed', level: 2 },
];

const EXPLORATION_ROLES: RoleDefinition[] = [
  { id: 'explorador', name: 'Explorador', branch: 'exploration', level: 0 },
  { id: 'trotamundos', name: 'Trotamundos', branch: 'exploration', level: 1 },
  { id: 'conquistador', name: 'Conquistador', branch: 'exploration', level: 2 },
];

const ACHIEVEMENT_ROLES: RoleDefinition[] = [
  { id: 'competidor', name: 'Competidor', branch: 'achievement', level: 0 },
  { id: 'coleccionador', name: 'Coleccionador', branch: 'achievement', level: 1 },
  { id: 'medallista', name: 'Medallista', branch: 'achievement', level: 2 },
];

export const BRANCH_ROLES: Record<RoleBranchId, RoleDefinition[]> = {
  distance: DISTANCE_ROLES,
  speed: SPEED_ROLES,
  exploration: EXPLORATION_ROLES,
  achievement: ACHIEVEMENT_ROLES,
};

export const OBJECTIVE_TO_BRANCH: Record<RoleObjective, RoleBranchId> = {
  maratonista: 'distance',
  velocista: 'speed',
  conquistador: 'exploration',
  medallista: 'achievement',
};

// ── Branch result ──────────────────────────────────────────────────────────

export interface BranchResult {
  branch: RoleBranchId;
  currentRole: RoleDefinition;
  nextRole: RoleDefinition | null;
  afinidad: number; // 0–100
  whyCurrentRole: string;
  howToProgress: string | null;
}

export interface RolesResult {
  branches: BranchResult[];
  // Sorted by (level desc, afinidad desc)
  primary: BranchResult;
  secondary: BranchResult | null;
  tertiary: BranchResult | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────

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

function formatKm(km: number): string {
  return `${km.toFixed(0)} km`;
}

function clamp(v: number): number {
  return Math.min(Math.round(v), 100);
}

// ── Distance branch ────────────────────────────────────────────────────────

function computeDistanceBranch(runs: StravaActivity[], stats: ProcessedStats): BranchResult {
  const { fondista_weekly_km, fondista_longest_km, ultrafondista_weekly_km,
    ultrafondista_longest_km, maratonista_longest_km } = DISTANCE_THRESHOLDS;
  const { maxPts_weekly, reference_weekly_km, maxPts_longest, reference_long_km, maxPts_longRatio } = DISTANCE_AFINIDAD;

  const avgWeeklyKm = stats.weeklyAvgDistance;
  const maxKm = runs.reduce((m, a) => Math.max(m, a.distance / 1000), 0);
  const longRuns = runs.filter(a => a.distance >= 15000).length;
  const longRatio = runs.length > 0 ? longRuns / runs.length : 0;

  let levelIdx = 0;
  if (maxKm >= maratonista_longest_km) {
    levelIdx = 3;
  } else if (avgWeeklyKm >= ultrafondista_weekly_km && maxKm >= ultrafondista_longest_km) {
    levelIdx = 2;
  } else if (avgWeeklyKm >= fondista_weekly_km || maxKm >= fondista_longest_km) {
    levelIdx = 1;
  }

  const role = DISTANCE_ROLES[levelIdx];
  const nextRole = levelIdx < DISTANCE_ROLES.length - 1 ? DISTANCE_ROLES[levelIdx + 1] : null;

  const afinidad = clamp(
    Math.min(avgWeeklyKm / reference_weekly_km * maxPts_weekly, maxPts_weekly) +
    Math.min(maxKm / reference_long_km * maxPts_longest, maxPts_longest) +
    Math.min(longRatio * 200, maxPts_longRatio)
  );

  const whyMap: Record<string, string> = {
    amateur: `Corrés regularmente con un promedio de ${formatKm(avgWeeklyKm)} semanales. Estás construyendo tu base de kilómetros.`,
    fondista: `Acumulás ${formatKm(avgWeeklyKm)} semanales y tu salida más larga fue de ${formatKm(maxKm)}. Las distancias medias son tu terreno.`,
    ultrafondista: `Promediás ${formatKm(avgWeeklyKm)} semanales y completaste salidas de ${formatKm(maxKm)}. El alto volumen es tu sello.`,
    maratonista: `Completaste una maratón (${formatKm(maxKm)}). Pertenecés a un selecto grupo de corredores.`,
  };

  const howMap: Record<string, string | null> = {
    amateur: `Para Fondista: alcanzá ${fondista_weekly_km} km semanales de promedio o completá una salida de ${fondista_longest_km} km.`,
    fondista: `Para Ultrafondista: llegá a ${ultrafondista_weekly_km} km semanales y completá una salida de ${ultrafondista_longest_km} km.`,
    ultrafondista: `Para Maratonista: completá una maratón completa (${maratonista_longest_km} km).`,
    maratonista: null,
  };

  return {
    branch: 'distance',
    currentRole: role,
    nextRole,
    afinidad,
    whyCurrentRole: whyMap[role.id] ?? '',
    howToProgress: howMap[role.id] ?? null,
  };
}

// ── Speed branch ───────────────────────────────────────────────────────────

function computeSpeedBranch(runs: StravaActivity[], stats: ProcessedStats): BranchResult {
  const { pasadista_pace_sec, velocista_pace_sec } = SPEED_THRESHOLDS;
  const { maxPts_pace, reference_worst_pace, reference_best_pace, maxPts_frequency, reference_weekly_activities } = SPEED_AFINIDAD;

  const bestPaceSec = stats.bestPace;
  const recent12 = stats.weekly.slice(-12);
  const avgActivities = recent12.length > 0
    ? recent12.reduce((s, w) => s + w.count, 0) / recent12.length
    : 0;

  let levelIdx = 0;
  if (bestPaceSec > 0 && bestPaceSec < velocista_pace_sec) {
    levelIdx = 2;
  } else if (bestPaceSec > 0 && bestPaceSec < pasadista_pace_sec) {
    levelIdx = 1;
  }

  const role = SPEED_ROLES[levelIdx];
  const nextRole = levelIdx < SPEED_ROLES.length - 1 ? SPEED_ROLES[levelIdx + 1] : null;

  const paceScore = bestPaceSec > 0 && bestPaceSec < reference_worst_pace
    ? Math.max(0, (reference_worst_pace - bestPaceSec) / (reference_worst_pace - reference_best_pace) * maxPts_pace)
    : 0;
  const freqScore = Math.min(avgActivities / reference_weekly_activities * maxPts_frequency, maxPts_frequency);
  const afinidad = clamp(paceScore + freqScore);

  function fmtPace(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}/km`;
  }

  const paceLabel = bestPaceSec > 0 ? fmtPace(Math.round(bestPaceSec)) : '—';

  const whyMap: Record<string, string> = {
    corredor: `Tu mejor ritmo registrado es ${paceLabel}. La velocidad mejorará con el entrenamiento regular.`,
    pasadista: `Alcanzaste ritmos de ${paceLabel}, por debajo de ${fmtPace(pasadista_pace_sec)}. Estás construyendo velocidad real.`,
    velocista: `Tus ritmos de ${paceLabel} son notablemente rápidos. La velocidad es tu sello.`,
  };

  const howMap: Record<string, string | null> = {
    corredor: `Para Pasadista: alcanzá un ritmo menor a ${fmtPace(pasadista_pace_sec)} en al menos una salida de 5+ km.`,
    pasadista: `Para Velocista: alcanzá un ritmo menor a ${fmtPace(velocista_pace_sec)} en alguna salida.`,
    velocista: null,
  };

  return {
    branch: 'speed',
    currentRole: role,
    nextRole,
    afinidad,
    whyCurrentRole: whyMap[role.id] ?? '',
    howToProgress: howMap[role.id] ?? null,
  };
}

// ── Exploration branch ─────────────────────────────────────────────────────

function computeExplorationBranch(runs: StravaActivity[], stats: ProcessedStats): BranchResult {
  const { trotamundos_trail_ratio, trotamundos_total_km, conquistador_trail_ratio, conquistador_total_km } = EXPLORATION_THRESHOLDS;
  const { explorador_min_places, trotamundos_min_places, conquistador_min_places } = EXPLORATION_DISTINCT_PLACES;
  const { maxPts_trailRatio, maxPts_totalKm, reference_total_km, maxPts_elevation, reference_elevation } = EXPLORATION_AFINIDAD;

  const totalKm = stats.totalDistance;
  const trailRuns = runs.filter(a => (a.sport_type || a.type) === 'TrailRun');
  const trailRatio = runs.length > 0 ? trailRuns.length / runs.length : 0;
  const totalElevation = runs.reduce((s, a) => s + a.total_elevation_gain, 0);
  const distinctPlaces = countDistinctStartingPlaces(runs);

  let levelIdx = 0;
  if (
    distinctPlaces >= conquistador_min_places ||
    (trailRatio >= conquistador_trail_ratio && totalKm >= conquistador_total_km)
  ) {
    levelIdx = 2;
  } else if (
    distinctPlaces >= trotamundos_min_places ||
    trailRatio >= trotamundos_trail_ratio ||
    totalKm >= trotamundos_total_km
  ) {
    levelIdx = 1;
  }

  const role = EXPLORATION_ROLES[levelIdx];
  const nextRole = levelIdx < EXPLORATION_ROLES.length - 1 ? EXPLORATION_ROLES[levelIdx + 1] : null;

  const afinidad = clamp(
    Math.min(trailRatio * 200, maxPts_trailRatio) +
    Math.min(totalKm / reference_total_km * maxPts_totalKm, maxPts_totalKm) +
    Math.min(totalElevation / reference_elevation * maxPts_elevation, maxPts_elevation)
  );

  const pctTrail = Math.round(trailRatio * 100);

  const whyMap: Record<string, string> = {
    explorador: `Saliste desde ${distinctPlaces} lugar${distinctPlaces !== 1 ? 'es' : ''} distinto${distinctPlaces !== 1 ? 's' : ''} con ${formatKm(totalKm)} acumulados. Empezás a explorar tu entorno.`,
    trotamundos: `${pctTrail > 0 ? `El ${pctTrail}% de tus salidas son de trail y t` : 'T'}enés ${formatKm(totalKm)} acumulados y ${distinctPlaces} lugares distintos explorados.`,
    conquistador: `El ${pctTrail}% de tus salidas son de trail, acumulaste ${formatKm(totalKm)} y exploraste ${distinctPlaces} lugares distintos. Sos un corredor versátil.`,
  };

  const howMap: Record<string, string | null> = {
    explorador: `Para Trotamundos: alcanzá ${trotamundos_min_places} lugares distintos de salida, o acumulá ${trotamundos_total_km} km, o hacé trail en al menos el ${Math.round(trotamundos_trail_ratio * 100)}% de tus salidas.`,
    trotamundos: `Para Conquistador: alcanzá ${conquistador_min_places} lugares distintos, o llegá a ${conquistador_total_km} km acumulados con trail en al menos el ${Math.round(conquistador_trail_ratio * 100)}%.`,
    conquistador: null,
  };

  return {
    branch: 'exploration',
    currentRole: role,
    nextRole,
    afinidad,
    whyCurrentRole: whyMap[role.id] ?? '',
    howToProgress: howMap[role.id] ?? null,
  };
}

// ── Achievement branch ─────────────────────────────────────────────────────

function computeAchievementBranch(runs: StravaActivity[], stats: ProcessedStats): BranchResult {
  const { competidor_min_activities, coleccionador_min_activities, coleccionador_min_milestones,
    coleccionador_min_total_km, medallista_min_activities, medallista_min_milestones,
    medallista_min_total_km } = ACHIEVEMENT_THRESHOLDS;
  const { maxPts_activities, reference_activities, maxPts_milestones, total_milestones, maxPts_totalKm, reference_km } = ACHIEVEMENT_AFINIDAD;

  const totalActivities = stats.totalActivities;
  const reached = milestonesReached(runs);
  const milestoneCount = reached.size;
  const hasHalfMarathon = reached.has(HALF_MARATHON_KM);

  let levelIdx = 0;
  if (
    totalActivities >= medallista_min_activities &&
    milestoneCount >= medallista_min_milestones &&
    hasHalfMarathon &&
    stats.totalDistance >= medallista_min_total_km
  ) {
    levelIdx = 2;
  } else if (
    totalActivities >= coleccionador_min_activities &&
    milestoneCount >= coleccionador_min_milestones &&
    stats.totalDistance >= coleccionador_min_total_km
  ) {
    levelIdx = 1;
  } else if (totalActivities >= competidor_min_activities || milestoneCount >= 1) {
    levelIdx = 0;
  }

  const role = ACHIEVEMENT_ROLES[levelIdx];
  const nextRole = levelIdx < ACHIEVEMENT_ROLES.length - 1 ? ACHIEVEMENT_ROLES[levelIdx + 1] : null;

  const afinidad = clamp(
    Math.min(totalActivities / reference_activities * maxPts_activities, maxPts_activities) +
    Math.min(milestoneCount / total_milestones * maxPts_milestones, maxPts_milestones) +
    Math.min(stats.totalDistance / reference_km * maxPts_totalKm, maxPts_totalKm)
  );

  const whyMap: Record<string, string> = {
    competidor: `Tenés ${totalActivities} actividades registradas y ${milestoneCount} hito${milestoneCount !== 1 ? 's' : ''} de distancia desbloqueado${milestoneCount !== 1 ? 's' : ''}. Cada salida suma.`,
    coleccionador: `Con ${totalActivities} actividades y ${milestoneCount} hitos desbloqueados mostrás un historial sólido y variado.`,
    medallista: `${totalActivities} actividades y ${milestoneCount} hitos de distancia, incluyendo la media maratón. Sos un referente en logros de carrera.`,
  };

  const howMap: Record<string, string | null> = {
    competidor: `Para Coleccionador: llegá a ${coleccionador_min_activities} actividades y desbloqueá al menos ${coleccionador_min_milestones} hitos de distancia.`,
    coleccionador: `Para Medallista: llegá a ${medallista_min_activities} actividades y desbloqueá ${medallista_min_milestones} hitos incluyendo la media maratón.`,
    medallista: null,
  };

  return {
    branch: 'achievement',
    currentRole: role,
    nextRole,
    afinidad,
    whyCurrentRole: whyMap[role.id] ?? '',
    howToProgress: howMap[role.id] ?? null,
  };
}

// ── Main export ────────────────────────────────────────────────────────────

export function computeRoles(activities: StravaActivity[], stats: ProcessedStats): RolesResult {
  const runs = getRuns(activities);

  const branches: BranchResult[] = [
    computeDistanceBranch(runs, stats),
    computeSpeedBranch(runs, stats),
    computeExplorationBranch(runs, stats),
    computeAchievementBranch(runs, stats),
  ];

  const sorted = [...branches].sort((a, b) => {
    const levelDiff = b.currentRole.level - a.currentRole.level;
    return levelDiff !== 0 ? levelDiff : b.afinidad - a.afinidad;
  });

  return {
    branches,
    primary: sorted[0],
    secondary: sorted[1] ?? null,
    tertiary: sorted[2] ?? null,
  };
}

// ── ADN scores ─────────────────────────────────────────────────────────────

export interface AdnScores {
  resistencia: number;
  velocidad: number;
  consistencia: number;
  exploracion: number;
  logros: number;
}

export function computeAdnScores(
  activities: StravaActivity[],
  stats: ProcessedStats
): AdnScores {
  const runs = getRuns(activities);

  // RESISTENCIA: weekly avg distance (50 km/week = 100)
  const resistencia = Math.min(100, Math.round(stats.weeklyAvgDistance / 50 * 100));

  // VELOCIDAD: best pace (4:00/km best, 7:00/km worst)
  const WORST = 420;
  const BEST = 240;
  const velocidad = stats.bestPace > 0 && stats.bestPace < WORST
    ? Math.min(100, Math.round(Math.max(0, (WORST - stats.bestPace) / (WORST - BEST) * 100)))
    : 0;

  // CONSISTENCIA: active-week ratio over last 12 weeks
  const recent12 = stats.weekly.slice(-12);
  const activeW = recent12.filter(w => w.distance > 0).length;
  const consistencia = recent12.length > 0 ? Math.round(activeW / recent12.length * 100) : 0;

  // EXPLORACIÓN: trail ratio + cumulative km
  const trailRuns = runs.filter(a => (a.sport_type || a.type) === 'TrailRun');
  const trailRatio = runs.length > 0 ? trailRuns.length / runs.length : 0;
  const exploracion = Math.min(100, Math.round(
    Math.min(trailRatio * 150, 75) +
    Math.min(stats.totalDistance / 2000 * 25, 25)
  ));

  // LOGROS: milestones + activities + total km
  const milestones = milestonesReached(runs).size;
  const logros = Math.min(100, Math.round(
    Math.min(milestones / 6 * 50, 50) +
    Math.min(stats.totalActivities / 100 * 25, 25) +
    Math.min(stats.totalDistance / 1000 * 25, 25)
  ));

  return { resistencia, velocidad, consistencia, exploracion, logros };
}

export function computeObjectiveAfinidad(
  objective: RoleObjective,
  roles: RolesResult
): { afinidad: number } {
  const branch = OBJECTIVE_TO_BRANCH[objective];
  const br = roles.branches.find(b => b.branch === branch);
  return { afinidad: br?.afinidad ?? 0 };
}

// ── Objective checklist ────────────────────────────────────────────────────

export interface ChecklistItem {
  label: string;
  passed: boolean;
}

export function computeObjectiveChecklist(
  objective: RoleObjective,
  activities: StravaActivity[],
  stats: ProcessedStats
): ChecklistItem[] {
  const runs = getRuns(activities);
  const maxKm = runs.reduce((m, a) => Math.max(m, a.distance / 1000), 0);
  const avgWeeklyKm = stats.weeklyAvgDistance;
  const bestPaceSec = stats.bestPace;
  const trailRuns = runs.filter(a => (a.sport_type || a.type) === 'TrailRun');
  const trailRatio = runs.length > 0 ? trailRuns.length / runs.length : 0;
  const totalKm = stats.totalDistance;
  const totalActivities = stats.totalActivities;
  const milestoneCount = milestonesReached(runs).size;

  const fmtPace = (sec: number) =>
    `<${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}/km`;

  const {
    fondista_weekly_km, ultrafondista_weekly_km, ultrafondista_longest_km, maratonista_longest_km,
  } = DISTANCE_THRESHOLDS;
  const { pasadista_pace_sec, velocista_pace_sec } = SPEED_THRESHOLDS;
  const { trotamundos_trail_ratio, trotamundos_total_km, conquistador_trail_ratio, conquistador_total_km } = EXPLORATION_THRESHOLDS;
  const { trotamundos_min_places, conquistador_min_places } = EXPLORATION_DISTINCT_PLACES;
  const distinctPlaces = countDistinctStartingPlaces(runs);
  const {
    competidor_min_activities, coleccionador_min_activities, coleccionador_min_milestones,
    coleccionador_min_total_km, medallista_min_activities, medallista_min_milestones, medallista_min_total_km,
  } = ACHIEVEMENT_THRESHOLDS;

  const CHECKLISTS: Record<RoleObjective, ChecklistItem[]> = {
    maratonista: [
      { label: `${fondista_weekly_km} km/sem`, passed: avgWeeklyKm >= fondista_weekly_km },
      { label: `${ultrafondista_longest_km} km salida`, passed: maxKm >= ultrafondista_longest_km },
      { label: `${ultrafondista_weekly_km} km/sem`, passed: avgWeeklyKm >= ultrafondista_weekly_km },
      { label: `Maratón ${maratonista_longest_km} km`, passed: maxKm >= maratonista_longest_km },
    ],
    velocista: [
      { label: fmtPace(pasadista_pace_sec), passed: bestPaceSec > 0 && bestPaceSec < pasadista_pace_sec },
      { label: fmtPace(velocista_pace_sec), passed: bestPaceSec > 0 && bestPaceSec < velocista_pace_sec },
    ],
    conquistador: [
      { label: `${trotamundos_min_places} lugares distintos`, passed: distinctPlaces >= trotamundos_min_places },
      { label: `O ${trotamundos_total_km} km`, passed: totalKm >= trotamundos_total_km },
      { label: `Trail ${Math.round(trotamundos_trail_ratio * 100)}%`, passed: trailRatio >= trotamundos_trail_ratio },
      { label: `${conquistador_min_places} lugares distintos`, passed: distinctPlaces >= conquistador_min_places },
      { label: `O ${conquistador_total_km} km`, passed: totalKm >= conquistador_total_km },
      { label: `Trail ${Math.round(conquistador_trail_ratio * 100)}%`, passed: trailRatio >= conquistador_trail_ratio },
    ],
    medallista: [
      { label: `${competidor_min_activities} salidas`, passed: totalActivities >= competidor_min_activities },
      { label: `${coleccionador_min_activities} salidas`, passed: totalActivities >= coleccionador_min_activities },
      { label: `${coleccionador_min_milestones} hitos`, passed: milestoneCount >= coleccionador_min_milestones },
      { label: `${coleccionador_min_total_km} km`, passed: totalKm >= coleccionador_min_total_km },
      { label: `${medallista_min_activities} salidas`, passed: totalActivities >= medallista_min_activities },
      { label: `${medallista_min_milestones} hitos`, passed: milestoneCount >= medallista_min_milestones },
      { label: `${medallista_min_total_km} km`, passed: totalKm >= medallista_min_total_km },
    ],
  };

  return CHECKLISTS[objective];
}
