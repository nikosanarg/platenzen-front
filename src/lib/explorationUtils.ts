/**
 * Utilities shared across exploration-branch role calculations.
 */

import { StravaActivity } from '@/types/strava';
import { decodePolyline } from '@/lib/polylineDecoder';

/** Great-circle distance in km between two lat/lon points (Haversine formula). */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Counts the number of distinct activity starting places among the given runs.
 * Two starting points are considered the same place when their great-circle
 * distance is ≤ 500 m. Starting position is taken from the first point of
 * each activity's summary polyline.
 */
export function countDistinctStartingPlaces(runs: StravaActivity[]): number {
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
