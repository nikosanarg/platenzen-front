import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';

const RUNNING_SPORTS = new Set(['Run', 'TrailRun', 'VirtualRun']);

// Minimum distance for a pace to be considered representative (avoids a 400m
// sprint winning "ritmo más rápido").
const MIN_PACE_DISTANCE_M = 3000;
const MIN_LONG_DISTANCE_M = 15000;

export type LegendaryCategory = 'distancia' | 'ritmo' | 'hito' | 'ritmo_largo';

export interface LegendarySession {
  activity: StravaActivity;
  category: LegendaryCategory;
  icon: string;        // emoji shown in the card header
  reason: string;      // badge text, e.g. "Distancia más larga"
  distanceKm: string;
  pace: string;
  dateLabel: string;
  stravaUrl: string;
}

// Fixed distance milestones (metres) the app recognises, highest → lowest.
const MILESTONES: { m: number; badge: string }[] = [
  { m: 42195, badge: 'Primera maratón' },
  { m: 31000, badge: 'Primer 31K' },
  { m: 21097.5, badge: 'Primera media maratón' },
  { m: 15000, badge: 'Primer 15K' },
  { m: 10000, badge: 'Primer 10K' },
  { m: 5000, badge: 'Primer 5K' },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function isRun(a: StravaActivity): boolean {
  return RUNNING_SPORTS.has(a.sport_type || a.type);
}

function paceSecPerKm(a: StravaActivity): number {
  return a.average_speed > 0 ? 1000 / a.average_speed : 0;
}

function byDateAsc(a: StravaActivity, b: StravaActivity): number {
  return new Date(a.start_date_local).getTime() - new Date(b.start_date_local).getTime();
}

function formatPace(secPerKm: number): string {
  if (secPerKm <= 0) return '—';
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, '0')}/km`;
}

const FULL_MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function formatDate(isoStr: string): string {
  const d = new Date(isoStr);
  return `${d.getDate()} de ${FULL_MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

// ── Candidate builders ──────────────────────────────────────────────────────
// Each returns an ordered list (best first) of candidates for one category.

interface Candidate {
  activity: StravaActivity;
  category: LegendaryCategory;
  icon: string;
  reason: string;
}

function longestCandidates(runs: StravaActivity[]): Candidate[] {
  return [...runs]
    .filter(a => a.distance > 0)
    .sort((a, b) => b.distance - a.distance)
    .map(a => ({ activity: a, category: 'distancia' as const, icon: '🥇', reason: 'Distancia más larga' }));
}

function fastestCandidates(runs: StravaActivity[]): Candidate[] {
  return runs
    .filter(a => a.distance >= MIN_PACE_DISTANCE_M && a.average_speed > 0)
    .sort((a, b) => paceSecPerKm(a) - paceSecPerKm(b))
    .map(a => ({ activity: a, category: 'ritmo' as const, icon: '⚡', reason: 'Ritmo más rápido' }));
}

function milestoneCandidates(runs: StravaActivity[]): Candidate[] {
  const out: Candidate[] = [];
  for (const ms of MILESTONES) {
    // First (earliest) run to reach this exact fixed distance.
    const first = runs.filter(a => a.distance >= ms.m).sort(byDateAsc)[0];
    if (first) out.push({ activity: first, category: 'hito', icon: '🎯', reason: ms.badge });
  }
  return out; // already highest → lowest milestone
}

function fastestLongCandidates(runs: StravaActivity[]): Candidate[] {
  return runs
    .filter(a => a.distance >= MIN_LONG_DISTANCE_M && a.average_speed > 0)
    .sort((a, b) => paceSecPerKm(a) - paceSecPerKm(b))
    .map(a => ({ activity: a, category: 'ritmo_largo' as const, icon: '🚀', reason: 'Mejor ritmo en distancia larga' }));
}

// ── Main export ─────────────────────────────────────────────────────────────

export function computeLegendarySessions(
  activities: StravaActivity[],
  // stats kept for signature compatibility with callers; not needed today.
  _stats?: ProcessedStats
): LegendarySession[] {
  void _stats;
  const runs = activities.filter(isRun);
  if (runs.length === 0) return [];

  // Categories in priority order. Greedy assignment guarantees 4 distinct
  // activities: each category takes its best candidate not already used.
  const categoryLists: Candidate[][] = [
    longestCandidates(runs),
    fastestCandidates(runs),
    milestoneCandidates(runs),
    fastestLongCandidates(runs),
  ];

  const used = new Set<number>();
  const picked: Candidate[] = [];

  for (const list of categoryLists) {
    const choice = list.find(c => !used.has(c.activity.id));
    if (choice) {
      used.add(choice.activity.id);
      picked.push(choice);
    }
  }

  return picked.map(({ activity, category, icon, reason }) => ({
    activity,
    category,
    icon,
    reason,
    distanceKm: (activity.distance / 1000).toFixed(2),
    pace: formatPace(paceSecPerKm(activity)),
    dateLabel: formatDate(activity.start_date_local),
    stravaUrl: `https://www.strava.com/activities/${activity.id}`,
  }));
}
