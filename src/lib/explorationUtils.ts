/**
 * Utilities shared across exploration-branch role calculations.
 */

import { Activity } from '@/types/activity';
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

/** Radio por defecto: dos salidas a menos de 500 m son "el mismo lugar". */
export const RADIO_LUGAR_KM = 0.5;

/**
 * Counts the number of distinct activity starting places among the given runs.
 * Two starting points are considered the same place when their great-circle
 * distance is ≤ `radiusKm`. Starting position is taken from the first point of
 * each activity's summary polyline.
 *
 * El radio es parámetro porque hay dos preguntas distintas: "¿salí desde otra
 * esquina?" (500 m, el default histórico) y "¿salí desde otra zona?", que es la
 * que hace la rama de Exploración y que usa el mismo radio con el que "Tu mundo"
 * agrupa zonas — si no, salir por otra puerta contaría como lugar nuevo.
 */
export function countDistinctStartingPlaces(
  runs: Activity[],
  radiusKm: number = RADIO_LUGAR_KM,
): number {
  const places: [number, number][] = [];
  for (const run of runs) {
    const polyline = run.map?.summary_polyline;
    if (!polyline) continue;
    const coords = decodePolyline(polyline);
    if (!coords.length) continue;
    const [lat, lon] = coords[0];
    const isNear = places.some(([pLat, pLon]) => haversineKm(lat, lon, pLat, pLon) <= radiusKm);
    if (!isNear) places.push([lat, lon]);
  }
  return places.length;
}
