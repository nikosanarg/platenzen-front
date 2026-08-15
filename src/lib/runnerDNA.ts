import { Activity } from '@/types/activity';
import { ProcessedStats } from '@/types/stats';
import { computeAchievements } from '@/lib/achievements';
import { countDistinctStartingPlaces } from '@/lib/explorationUtils';
import { MARATHON_KM } from '@/lib/distances';
import { isRunning } from '@/lib/sports';

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

function getRuns12mo(activities: Activity[]): Activity[] {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  const ms = cutoff.getTime();
  return activities.filter(a =>
    isRunning(a) &&
    new Date(a.start_date_local).getTime() >= ms
  );
}

function getRuns30d(activities: Activity[]): Activity[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const ms = cutoff.getTime();
  return activities.filter(a =>
    isRunning(a) &&
    new Date(a.start_date_local).getTime() >= ms
  );
}

// ── Attribute calculations ─────────────────────────────────────────────────

function computeResistencia(runs12mo: Activity[]): number {
  if (runs12mo.length === 0) return 0;

  const distancesKm = runs12mo.map(a => a.distance / 1000);
  const maxKm = Math.max(...distancesKm);
  const avgKm = distancesKm.reduce((s, d) => s + d, 0) / distancesKm.length;

  const rawScore = (7 * maxKm + 3 * avgKm) / 10;
  // Normalize: 0 km = 0, marathon distance = 100
  return clamp100((rawScore / MARATHON_KM) * 100);
}

function computeVelocidad(runs12mo: Activity[]): number {
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

function computeConsistencia(runs30d: Activity[]): number {
  // Distinct days with activity in the last 30 days
  const days = new Set(runs30d.map(a => a.start_date_local.slice(0, 10)));
  return clamp100((days.size / 30) * 100);
}

function computeExploracion(runs12mo: Activity[]): number {
  // Distinct starting places (tolerance ≤ 500 m) in the last 12 months
  const places = countDistinctStartingPlaces(runs12mo);
  // 0 places = 0, 25+ places = 100 (aligns with conquistador_min_places)
  return clamp100((places / 25) * 100);
}

function computeLogros(
  activities: Activity[],
  stats: ProcessedStats
): number {
  const achievementMap = computeAchievements(activities, stats);
  const all = Object.values(achievementMap).flat();
  const totalCount = all.length;
  const unlockedCount = all.filter(a => a.unlocked).length;
  // Normalize: 0 = 0, totalCount achievements unlocked = 100
  return clamp100((unlockedCount / totalCount) * 100);
}

// ── Main export ────────────────────────────────────────────────────────────

export function computeRunnerDNA(
  activities: Activity[],
  stats: ProcessedStats
): RunnerDNA {
  const runs12mo = getRuns12mo(activities);
  const runs30d = getRuns30d(activities);

  return {
    resistencia: computeResistencia(runs12mo),
    velocidad: computeVelocidad(runs12mo),
    consistencia: computeConsistencia(runs30d),
    exploracion: computeExploracion(runs12mo),
    logros: computeLogros(activities, stats),
  };
}

export function getRunnerDNATooltips(dna: RunnerDNA): RunnerDNATooltips {
  return {
    resistencia: `Resistencia (${dna.resistencia}/100)\nFórmula: (7 × distancia máxima + 3 × distancia promedio) / 10\nNormalizado: 0 km = 0, 42,195 km = 100\nBase: actividades de los últimos 12 meses`,
    velocidad: `Velocidad (${dna.velocidad}/100)\nFórmula: (3 × mejor ritmo + 2 × ritmo promedio) / 5\nNormalizado: 12:00/km = 0, 3:00/km = 100\nMenor ritmo = mayor puntaje\nBase: actividades de los últimos 12 meses`,
    consistencia: `Consistencia (${dna.consistencia}/100)\nDías distintos con actividad en los últimos 30 días\n0 días = 0, 30 días = 100`,
    exploracion: `Exploración (${dna.exploracion}/100)\nLugares de inicio distintos en los últimos 12 meses\n(tolerancia 500 m entre puntos de partida)\n0 lugares = 0, 25 lugares = 100`,
    logros: `Logros (${dna.logros}/100)\nLogros desbloqueados sobre el total posible\n${Math.round(dna.logros)}% de todos los logros disponibles`,
  };
}
