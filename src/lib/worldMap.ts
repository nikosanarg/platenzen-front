import { Activity } from '@/types/activity';
import { decodePolyline } from '@/lib/polylineDecoder';
import { splitPace } from '@/utils/pace';
import { isRunning } from '@/lib/sports';
import { haversineKm } from '@/lib/explorationUtils';

export interface ZoneActivity {
  activityId: number;
  name: string;
  date: string;       // formatted display date
  dateIso: string;    // ISO string for sorting
  distanceKm: number;
  paceSecPerKm: number;
}

export interface MapZone {
  id: string;
  lat: number;
  lon: number;
  visitCount: number;
  distanceKm: number;
  lastVisit: string;
  bestPaceSecPerKm: number;
  activities: ZoneActivity[];
  gridLat: number;
  gridLon: number;
}

export interface WorldMapData {
  zones: MapZone[];
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
  heatPoints: [number, number, number][];
}

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

export function computeWorldMap(activities: Activity[]): WorldMapData | null {
  const runs = activities.filter(a =>
    isRunning(a) && a.map?.summary_polyline
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
            dateIso: run.start_date_local,
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
      b.dateIso.localeCompare(a.dateIso)
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

/**
 * Un lugar donde corrés. Es lo que la lista llama "zona".
 *
 * Internamente el mapa parte el mundo en celdas de ~1 km, pero **eso no es una
 * zona y nunca debería llegar a la pantalla**: una corrida de 12 km atraviesa
 * diez celdas, así que aparecía repetida en cada una. De ahí salían las seis
 * filas idénticas de "35.1 km · 3×" — las mismas tres salidas contadas seis
 * veces — y el "11 zonas" que no significaba nada para quien mira.
 *
 * Por eso el conteo **no** es la suma de los conteos de sus celdas, sino la
 * cantidad de actividades distintas, deduplicadas por id.
 */
export interface ZoneCluster {
  id: string;
  lat: number;
  lon: number;
  /** Actividades distintas que pasaron por el lugar. */
  visitCount: number;
  distanceKm: number;
  lastVisit: string;
  bestPaceSecPerKm: number;
  activities: ZoneActivity[];
}

/**
 * Radio de un lugar, en km.
 *
 * Dos salidas a menos de esto son "el mismo lugar donde corro", no dos zonas
 * distintas. Es del orden del barrio, que es la escala a la que la pregunta
 * "¿dónde corrí?" tiene una respuesta útil.
 */
export const RADIO_ZONA_KM = 2;

/**
 * Junta las celdas vecinas en lugares.
 *
 * El agrupado es **geográfico y fijo**, no depende del zoom a propósito: si
 * dependiera, acercarse partiría un lugar en sus celdas y volverían las filas
 * repetidas. El zoom sirve para mirar de cerca, no para cambiar qué se cuenta.
 */
export function clusterZones(zones: MapZone[], radiusKm = RADIO_ZONA_KM): ZoneCluster[] {
  // De mayor a menor: la celda más visitada siembra el lugar, así el centro
  // queda donde de verdad se corre y no donde cayó la primera de la lista.
  const porImportancia = [...zones].sort((a, b) => b.visitCount - a.visitCount);
  const n = porImportancia.length;

  // Conjuntos disjuntos. Hace falta unir de a pares y que la unión se propague:
  // agrupar contra una semilla fija partía las corridas largas, porque un
  // recorrido de 12 km es una LÍNEA y sus celdas del final quedan lejísimos de
  // la primera aunque sean la misma salida.
  const padre = Array.from({ length: n }, (_, i) => i);
  const raiz = (i: number): number => (padre[i] === i ? i : (padre[i] = raiz(padre[i])));
  const unir = (a: number, b: number) => {
    const [ra, rb] = [raiz(a), raiz(b)];
    if (ra !== rb) padre[rb] = ra;
  };

  for (let i = 0; i < n; i++) {
    const actividadesI = new Set(porImportancia[i].activities.map(a => a.activityId));

    for (let j = i + 1; j < n; j++) {
      // Dos celdas son el mismo lugar si comparten una salida —es literalmente
      // la misma corrida pasando por las dos— o si están a tiro de caminata,
      // que junta puntos del mismo barrio aunque nunca los haya unido un
      // recorrido.
      const compartenSalida = porImportancia[j].activities.some(a => actividadesI.has(a.activityId));
      const cerca =
        haversineKm(
          porImportancia[i].lat,
          porImportancia[i].lon,
          porImportancia[j].lat,
          porImportancia[j].lon
        ) <= radiusKm;

      if (compartenSalida || cerca) unir(i, j);
    }
  }

  const porRaiz = new Map<number, MapZone[]>();
  for (let i = 0; i < n; i++) {
    const r = raiz(i);
    if (!porRaiz.has(r)) porRaiz.set(r, []);
    porRaiz.get(r)!.push(porImportancia[i]);
  }

  const grupos = [...porRaiz.values()].map(zonas => ({ zonas }));

  return grupos.map(({ zonas }) => {
    // Deduplicar por actividad: una corrida que cruza cinco celdas del grupo
    // es una sola corrida.
    const porActividad = new Map<number, ZoneActivity>();
    for (const zona of zonas) {
      for (const act of zona.activities) {
        if (!porActividad.has(act.activityId)) porActividad.set(act.activityId, act);
      }
    }

    const actividades = [...porActividad.values()].sort((a, b) =>
      b.dateIso.localeCompare(a.dateIso)
    );

    const totalKm = actividades.reduce((s, a) => s + a.distanceKm, 0);
    const ritmos = actividades.filter(a => a.paceSecPerKm > 0).map(a => a.paceSecPerKm);

    // El centro se pondera por visitas: el grupo se dibuja donde más se corrió.
    const pesoTotal = zonas.reduce((s, z) => s + z.visitCount, 0) || zonas.length;
    const lat = zonas.reduce((s, z) => s + z.lat * z.visitCount, 0) / pesoTotal;
    const lon = zonas.reduce((s, z) => s + z.lon * z.visitCount, 0) / pesoTotal;

    return {
      id: zonas.map(z => z.id).join('|'),
      lat,
      lon,
      visitCount: actividades.length,
      distanceKm: Math.round(totalKm * 10) / 10,
      lastVisit: actividades[0]?.date ?? '',
      bestPaceSecPerKm: ritmos.length > 0 ? Math.round(Math.min(...ritmos)) : 0,
      activities: actividades,
    };
  }).sort((a, b) => b.visitCount - a.visitCount);
}

export function formatPaceStr(secPerKm: number): string {
  if (secPerKm <= 0) return '—';
  const { minutes, seconds } = splitPace(secPerKm);
  return `${minutes}:${seconds}/km`;
}
