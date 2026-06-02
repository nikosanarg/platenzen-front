import { StravaActivity } from '@/types/strava';

const RUNNING_SPORTS = new Set(['Run', 'TrailRun', 'VirtualRun']);

export interface ZoneActivity {
  activityId: number;
  name: string;
  date: string;
  distanceKm: number;
  paceSecPerKm: number;
}

export interface MapZone {
  id: string;
  // Representative lat/lon center of this zone
  lat: number;
  lon: number;
  visitCount: number;
  distanceKm: number;
  lastVisit: string;
  bestPaceSecPerKm: number;
  activities: ZoneActivity[];
  // Grid cell coordinates (for relative positioning)
  gridLat: number;
  gridLon: number;
}

export interface WorldMapData {
  zones: MapZone[];
  // Bounding box for SVG rendering
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
  // Heatmap points: [lat, lon, intensity]
  heatPoints: [number, number, number][];
}

// ── Polyline decoder ───────────────────────────────────────────────────────

export function decodePolyline(encoded: string): [number, number][] {
  const coords: [number, number][] = [];
  let idx = 0, lat = 0, lon = 0;
  while (idx < encoded.length) {
    let b: number, shift = 0, result = 0;
    do { b = encoded.charCodeAt(idx++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(idx++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lon += result & 1 ? ~(result >> 1) : result >> 1;
    coords.push([lat / 1e5, lon / 1e5]);
  }
  return coords;
}

// ── Grid-based clustering ──────────────────────────────────────────────────

// ~1 km per cell
const ZONE_GRID = 0.01;

function cellKey(lat: number, lon: number): string {
  const cLat = Math.floor(lat / ZONE_GRID);
  const cLon = Math.floor(lon / ZONE_GRID);
  return `${cLat},${cLon}`;
}

function formatDate(isoStr: string): string {
  const d = new Date(isoStr);
  const months = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function computeWorldMap(activities: StravaActivity[]): WorldMapData | null {
  const runs = activities.filter(a =>
    RUNNING_SPORTS.has(a.sport_type || a.type) && a.map?.summary_polyline
  );

  if (runs.length === 0) return null;

  // Group activities by grid cell
  const zoneMap = new Map<string, {
    lats: number[];
    lons: number[];
    gridLat: number;
    gridLon: number;
    activities: ZoneActivity[];
  }>();

  // Also collect all points for heatmap
  const allPoints: [number, number][] = [];

  for (const run of runs) {
    const polyline = run.map!.summary_polyline!;
    let coords: [number, number][];
    try {
      coords = decodePolyline(polyline);
    } catch {
      continue;
    }
    if (coords.length === 0) continue;

    const km = run.distance / 1000;
    const paceSecPerKm = run.average_speed > 0 ? 1000 / run.average_speed : 0;

    // Track which cells this activity touches
    const touchedCells = new Set<string>();

    for (let i = 0; i < coords.length; i += 3) {
      const [lat, lon] = coords[i];
      allPoints.push([lat, lon]);

      const key = cellKey(lat, lon);
      if (!touchedCells.has(key)) {
        touchedCells.add(key);
        const gridLat = Math.floor(lat / ZONE_GRID);
        const gridLon = Math.floor(lon / ZONE_GRID);

        if (!zoneMap.has(key)) {
          zoneMap.set(key, { lats: [], lons: [], gridLat, gridLon, activities: [] });
        }

        const zone = zoneMap.get(key)!;
        zone.lats.push(lat);
        zone.lons.push(lon);

        // Only add this activity once per zone
        if (!zone.activities.find(a => a.activityId === run.id)) {
          zone.activities.push({
            activityId: run.id,
            name: run.name,
            date: formatDate(run.start_date_local),
            distanceKm: km,
            paceSecPerKm,
          });
        }
      }
    }
  }

  if (zoneMap.size === 0) return null;

  // Build zones from map
  const zones: MapZone[] = [];

  for (const [id, data] of zoneMap) {
    const centerLat = data.lats.reduce((s, v) => s + v, 0) / data.lats.length;
    const centerLon = data.lons.reduce((s, v) => s + v, 0) / data.lons.length;

    const sortedActs = [...data.activities].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const totalKm = data.activities.reduce((s, a) => s + a.distanceKm, 0);
    const validPaces = data.activities.filter(a => a.paceSecPerKm > 0);
    const bestPace = validPaces.length > 0
      ? Math.min(...validPaces.map(a => a.paceSecPerKm))
      : 0;

    zones.push({
      id,
      lat: centerLat,
      lon: centerLon,
      gridLat: data.gridLat,
      gridLon: data.gridLon,
      visitCount: data.activities.length,
      distanceKm: Math.round(totalKm * 10) / 10,
      lastVisit: sortedActs[0]?.date ?? '',
      bestPaceSecPerKm: Math.round(bestPace),
      activities: sortedActs,
    });
  }

  // Sort by visit count descending
  zones.sort((a, b) => b.visitCount - a.visitCount);

  // Compute bounding box
  const allLats = zones.map(z => z.lat);
  const allLons = zones.map(z => z.lon);
  const minLat = Math.min(...allLats);
  const maxLat = Math.max(...allLats);
  const minLon = Math.min(...allLons);
  const maxLon = Math.max(...allLons);

  // Build heatmap points: [lat, lon, intensity]
  // Intensity = visit count normalized 0–1
  const maxVisits = zones.length > 0 ? zones[0].visitCount : 1;
  const heatPoints: [number, number, number][] = zones.map(z => [
    z.lat, z.lon, z.visitCount / maxVisits,
  ]);

  return {
    zones: zones.slice(0, 50), // keep top 50 zones for performance
    minLat,
    maxLat,
    minLon,
    maxLon,
    heatPoints,
  };
}

export function formatPaceStr(secPerKm: number): string {
  if (secPerKm <= 0) return '—';
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, '0')}/km`;
}
