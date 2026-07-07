/**
 * Canonical race-distance constants.
 *
 * Half and full marathon use their *exact* official distances so that a run
 * only qualifies as a media maratón / maratón when it truly reaches them.
 * A 42 km run, for example, is NOT a marathon — it falls short by 195 m.
 */

export const HALF_MARATHON_KM = 21.0975;
export const MARATHON_KM = 42.195;

export const HALF_MARATHON_M = HALF_MARATHON_KM * 1000; // 21097.5
export const MARATHON_M = MARATHON_KM * 1000; // 42195

export interface CoreDistance {
  km: number;
  meters: number;
  label: string;
}

/**
 * Core race distances used for the hero "record" stat.
 * Only these distances count — the record shown is the one with the highest
 * kilometrage the runner has actually reached.
 */
export const CORE_DISTANCES: CoreDistance[] = [
  { km: 5, meters: 5000, label: '5K' },
  { km: 10, meters: 10000, label: '10K' },
  { km: HALF_MARATHON_KM, meters: HALF_MARATHON_M, label: '21K' },
  { km: MARATHON_KM, meters: MARATHON_M, label: '42K' },
  { km: 100, meters: 100000, label: '100K' },
];

/** Format a km value with Argentine locale (comma decimals), e.g. 21.0975 → "21,0975". */
export function formatKmExact(km: number): string {
  return km.toLocaleString('es-AR', { maximumFractionDigits: 4 });
}
