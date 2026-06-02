import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';
import { computeAchievements } from '@/lib/achievements';
import { decodePolyline } from '@/lib/polylineDecoder';

const RUNNING_SPORTS = new Set(['Run', 'TrailRun', 'VirtualRun']);

export interface RunnerDNA {
  resistencia: number;  // 0–100
  velocidad: number;    // 0–100
  consistencia: number; // 0–100
  exploracion: number;  // 0–100
  logros: number;       // 0–100
}

export interface RunnerDNATooltips {
  resistencia: string;
  velocidad: string;
  consistencia: string;
  exploracion: string;
  logros: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function clamp100(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function getRuns12mo(activities: StravaActivity[]): StravaActivity[] {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  const ms = cutoff.getTime();
  return activities.filter(a =>
    RUNNING_SPORTS.has(a.sport_type || a.type) &&
    new Date(a.start_date_local).getTime() >= ms
  );
}

function getRuns30d(activities: StravaActivity[]): StravaActivity[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const ms = cutoff.getTime();
  return activities.filter(a =>
    RUNNING_SPORTS.has(a.sport_type || a.type) &&
    new Date(a.start_date_local).getTime() >= ms
  );
}

// Count distinct geographic zones using a grid (cell ≈ 0.5 km)
function countDistinctZones(runs: StravaActivity[]): number {
  const cells = new Set<string>();
  const GRID = 0.005; // ~0.5 km per cell

  for (const run of runs) {
    const polyline = run.map?.summary_polyline;
    if (!polyline) continue;
    try {
      const coords = decodePolyline(polyline);
      // Sample every 5th point to reduce computation
      for (let i = 0; i < coords.length; i += 5) {
        const [lat, lon] = coords[i];
        const cellLat = Math.floor(lat / GRID);
        const cellLon = Math.floor(lon / GRID);
        cells.add(`${cellLat},${cellLon}`);
      }
    } catch {
      // Ignore malformed polylines
    }
  }
  return cells.size;
}

// ── Attribute calculations ─────────────────────────────────────────────────

function computeResistencia(runs12mo: StravaActivity[]): number {
  if (runs12mo.length === 0) return 0;

  const distancesKm = runs12mo.map(a => a.distance / 1000);
  const maxKm = Math.max(...distancesKm);
  const avgKm = distancesKm.reduce((s, d) => s + d, 0) / distancesKm.length;

  const rawScore = (7 * maxKm + 3 * avgKm) / 10;
  // Normalize: 0 km = 0, 42.2 km = 100
  return clamp100((rawScore / 42.2) * 100);
}

function computeVelocidad(runs12mo: StravaActivity[]): number {
  const validRuns = runs12mo.filter(a => a.distance >= 1000 && a.average_speed > 0);
  if (validRuns.length === 0) return 0;

  // pace in sec/km (lower = faster)
  const paces = validRuns.map(a => 1000 / a.average_speed);
  const bestPace = Math.min(...paces);
  const avgPace = paces.reduce((s, p) => s + p, 0) / paces.length;

  // Combined pace (lower = better)
  const combinedPace = (3 * bestPace + 2 * avgPace) / 5;

  // Normalize: 12:00/km (720s) = 0, 3:00/km (180s) = 100 (inverted: faster = higher)
  const WORST = 720; // 12:00/km
  const BEST = 180;  // 3:00/km
  const normalized = (WORST - combinedPace) / (WORST - BEST) * 100;
  return clamp100(normalized);
}

function computeConsistencia(runs30d: StravaActivity[]): number {
  // Distinct days with activity in the last 30 days
  const days = new Set(runs30d.map(a => a.start_date_local.slice(0, 10)));
  return clamp100((days.size / 30) * 100);
}

function computeExploracion(runs30d: StravaActivity[]): number {
  // Distinct geographic zones (clusters) in the last 30 days
  const zones = countDistinctZones(runs30d);
  // 0 zones = 0, 15+ zones = 100
  return clamp100((zones / 15) * 100);
}

function computeLogros(
  activities: StravaActivity[],
  runs30d: StravaActivity[],
  stats: ProcessedStats
): number {
  if (runs30d.length === 0) return 0;

  // Count achievements unlocked within the last 30 days
  const cutoff30d = new Date();
  cutoff30d.setDate(cutoff30d.getDate() - 30);
  const cutoffStr = cutoff30d.toISOString().slice(0, 10);

  const achievementMap = computeAchievements(activities, stats);
  const all = Object.values(achievementMap).flat();
  const recentUnlocked = all.filter(
    a => a.unlocked && a.unlockedAt !== null && a.unlockedAt >= cutoffStr
  ).length;

  const avgPerActivity = recentUnlocked / runs30d.length;
  // Normalize: 0 = 0, 5 avg = 100
  return clamp100((avgPerActivity / 5) * 100);
}

// ── Main export ────────────────────────────────────────────────────────────

export function computeRunnerDNA(
  activities: StravaActivity[],
  stats: ProcessedStats
): RunnerDNA {
  const runs12mo = getRuns12mo(activities);
  const runs30d = getRuns30d(activities);

  return {
    resistencia: computeResistencia(runs12mo),
    velocidad: computeVelocidad(runs12mo),
    consistencia: computeConsistencia(runs30d),
    exploracion: computeExploracion(runs30d),
    logros: computeLogros(activities, runs30d, stats),
  };
}

export function getRunnerDNATooltips(dna: RunnerDNA): RunnerDNATooltips {
  return {
    resistencia: `Resistencia (${dna.resistencia}/100)\nFórmula: (7 × distancia máxima + 3 × distancia promedio) / 10\nNormalizado: 0 km = 0, 42.2 km = 100\nBase: actividades de los últimos 12 meses`,
    velocidad: `Velocidad (${dna.velocidad}/100)\nFórmula: (3 × mejor ritmo + 2 × ritmo promedio) / 5\nNormalizado: 12:00/km = 0, 3:00/km = 100\nMenor ritmo = mayor puntaje\nBase: actividades de los últimos 12 meses`,
    consistencia: `Consistencia (${dna.consistencia}/100)\nDías distintos con actividad en los últimos 30 días\n0 días = 0, 30 días = 100`,
    exploracion: `Exploración (${dna.exploracion}/100)\nZonas geográficas distintas recorridas en los últimos 30 días\nDetectadas mediante clustering de rutas (polylines de Strava)\n0 zonas = 0, 15 zonas = 100`,
    logros: `Logros (${dna.logros}/100)\nPromedio de logros desbloqueados por actividad en los últimos 30 días\n0 logros = 0, 5 logros por actividad = 100`,
  };
}
