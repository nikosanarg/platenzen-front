/**
 * Role unlock thresholds — adjust these values to change when each role
 * activates or evolves. All numeric values are in km, sec/km, or counts.
 */

// ── Distance branch ────────────────────────────────────────────────────────

export const DISTANCE_THRESHOLDS = {
  /** Weekly km average required for Fondista */
  fondista_weekly_km: 15,
  /** Single-run km required for Fondista (alternative to weekly avg) */
  fondista_longest_km: 15,
  /** Weekly km average required for Ultrafondista */
  ultrafondista_weekly_km: 35,
  /** Single-run km required for Ultrafondista */
  ultrafondista_longest_km: 21.1,
  /** Single-run km required for Maratonista */
  maratonista_longest_km: 42.2,
} as const;

/** Afinidad scoring weights for the distance branch (must add up to 100) */
export const DISTANCE_AFINIDAD = {
  /** Max pts from weekly km (divided by reference_weekly_km to scale 0–maxPts) */
  maxPts_weekly: 40,
  reference_weekly_km: 50,
  /** Max pts from longest run (divided by reference_long_km) */
  maxPts_longest: 35,
  reference_long_km: 42.2,
  /** Max pts from long-run ratio (≥ 15 km) */
  maxPts_longRatio: 25,
} as const;

// ── Speed branch ───────────────────────────────────────────────────────────

export const SPEED_THRESHOLDS = {
  /** Best pace (sec/km) required for Pasadista (strictly less than) */
  pasadista_pace_sec: 300, // 5:00/km
  /** Best pace (sec/km) required for Velocista (strictly less than) */
  velocista_pace_sec: 270, // 4:30/km
} as const;

/** Afinidad scoring weights for the speed branch */
export const SPEED_AFINIDAD = {
  /** Max pts from pace score (worst=420sec, best=240sec → 60 pts) */
  maxPts_pace: 60,
  reference_worst_pace: 420,
  reference_best_pace: 240,
  /** Max pts from weekly frequency */
  maxPts_frequency: 40,
  reference_weekly_activities: 5,
} as const;

// ── Exploration branch ─────────────────────────────────────────────────────

export const EXPLORATION_THRESHOLDS = {
  /** Trail run ratio (0–1) required for Trotamundos (alternative) */
  trotamundos_trail_ratio: 0.15,
  /** Cumulative km required for Trotamundos (alternative) */
  trotamundos_total_km: 300,
  /** Trail run ratio required for Conquistador */
  conquistador_trail_ratio: 0.25,
  /** Cumulative km required for Conquistador */
  conquistador_total_km: 500,
} as const;

/** Afinidad scoring weights for the exploration branch */
export const EXPLORATION_AFINIDAD = {
  maxPts_trailRatio: 50,
  maxPts_totalKm: 30,
  reference_total_km: 1000,
  maxPts_elevation: 20,
  reference_elevation: 10000,
} as const;

// ── Achievement branch ─────────────────────────────────────────────────────

export const ACHIEVEMENT_THRESHOLDS = {
  /** Min activities to be at least Competidor */
  competidor_min_activities: 10,
  /** Min activities for Coleccionador */
  coleccionador_min_activities: 50,
  /** Min milestones (of 6) for Coleccionador */
  coleccionador_min_milestones: 4,
  /** Min activities for Medallista */
  medallista_min_activities: 100,
  /** Min milestones for Medallista (must include 21.1 km) */
  medallista_min_milestones: 6,
  coleccionador_min_total_km: 500,
  medallista_min_total_km: 1000
} as const;

/** Afinidad scoring weights for the achievement branch */
export const ACHIEVEMENT_AFINIDAD = {
  maxPts_activities: 20,
  reference_activities: 100,
  maxPts_milestones: 50,
  total_milestones: 6,
  maxPts_totalKm: 25,
  reference_km: 1000,
} as const;

// ── Milestone distances ────────────────────────────────────────────────────

/** Standard race distances used for milestone detection (km) */
export const MILESTONE_KM = [5, 10, 15, 21.1, 31.5, 42.2] as const;
