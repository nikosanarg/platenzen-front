import { Activity } from '@/types/activity';
import { ProcessedStats } from '@/types/stats';
import { computeEnrichedLastActivity } from '@/lib/lastActivity';
import { computeFormShape } from '@/lib/formShape';
import { computeCoachRecommendation } from '@/lib/coach';
import { splitPace } from '@/utils/pace';
import { isRunning } from '@/lib/sports';

// ── Public shapes ────────────────────────────────────────────────────────────

export interface AnalisisActivity {
  name: string;
  dateTimeLabel: string;   // "18 jul 2026, 17:32"
  dateLabel: string;       // "18 jul 2026"
  distanceKm: string;      // "15.01"
  durationLabel: string;   // "1:22:48"
  pace: string;            // "5:31/km"
  polyline: string | null;
  stravaUrl: string;
}

export type InsightTone = 'positive' | 'neutral' | 'warning';

export interface Insight {
  text: string;
  tone: InsightTone;
}

export interface HighlightCard {
  icon: 'trend' | 'medal' | 'route' | 'flame' | 'calendar';
  value: string;
  label: string;
  sub: string;
  tone: InsightTone;
}

export type DayKind = 'done' | 'run' | 'rest' | 'none';

export interface DayPlan {
  day: string;             // "Hoy", "Mañana", "Sábado"…
  label: string;           // "Trote suave 6–8K"
  kind: DayKind;
}

export interface CoachAnalisis {
  activity: AnalisisActivity;
  insights: Insight[];
  highlights: HighlightCard[];
  agenda: DayPlan[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function isRun(a: Activity): boolean {
  return isRunning(a);
}

function paceSecPerKm(a: Activity): number {
  return a.average_speed > 0 ? 1000 / a.average_speed : 0;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatClock(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatPace(secPerKm: number): string {
  const { minutes, seconds } = splitPace(secPerKm);
  return `${minutes}:${seconds}/km`;
}

function distanceBucketLabel(km: number): string {
  return `${Math.round(km)}K`;
}

function ordinal(n: number): string {
  return `${n}`;
}

/** Kilómetros corridos en un día concreto (varias salidas suman). */
function kmOnDay(runs: Activity[], day: Date): number {
  const target = day.toDateString();
  return runs
    .filter(a => new Date(a.start_date_local).toDateString() === target)
    .reduce((sum, a) => sum + a.distance, 0) / 1000;
}

/** Suma de km en una ventana móvil de `days` días, empezando `offsetDays` atrás. */
function kmInTrailingDays(runs: Activity[], now: Date, days: number, offsetDays: number): number {
  let total = 0;
  for (let i = offsetDays; i < offsetDays + days; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    total += kmOnDay(runs, d);
  }
  return total;
}

// ── Insight generation ───────────────────────────────────────────────────────

function buildInsights(activity: Activity, allRuns: Activity[]): Insight[] {
  const insights: Insight[] = [];
  const km = activity.distance / 1000;
  const thisPace = paceSecPerKm(activity);
  const bucket = distanceBucketLabel(km);

  // Similar-distance runs (±2.5 km), excluding this one.
  const similar = allRuns.filter(
    a => a.id !== activity.id && a.distance > 0 && Math.abs(a.distance / 1000 - km) <= 2.5 && paceSecPerKm(a) > 0
  );

  // 1) Pace vs average of similar distance.
  if (thisPace > 0 && similar.length >= 2) {
    const avgPace = similar.reduce((s, a) => s + paceSecPerKm(a), 0) / similar.length;
    const diff = Math.round(avgPace - thisPace); // positive → faster than average
    if (diff >= 3) {
      insights.push({ text: `Ritmo promedio ${diff}s/km más rápido que tu promedio de ${bucket}.`, tone: 'positive' });
    } else if (diff <= -3) {
      insights.push({ text: `Ritmo ${Math.abs(diff)}s/km más lento que tu promedio de ${bucket} — salida de rodaje.`, tone: 'neutral' });
    } else {
      insights.push({ text: `Ritmo alineado con tu promedio histórico de ${bucket}.`, tone: 'neutral' });
    }
  } else if (thisPace > 0) {
    insights.push({ text: `Primera referencia de ritmo para tus salidas de ${bucket}.`, tone: 'neutral' });
  }

  // 2) Distance context — is this a long / notable one?
  const longer = allRuns.filter(a => a.id !== activity.id && a.distance > activity.distance).length;
  if (allRuns.length > 3 && longer === 0) {
    insights.push({ text: `Es tu salida más larga registrada: ${km.toFixed(2)} km.`, tone: 'positive' });
  } else if (allRuns.length > 5 && longer <= 2) {
    insights.push({ text: `Entre tus ${longer + 1} salidas más largas hasta hoy.`, tone: 'positive' });
  }

  // 3) Elevation.
  const elev = activity.total_elevation_gain || 0;
  const elevPerKm = km > 0 ? elev / km : 0;
  if (elevPerKm >= 12) {
    insights.push({ text: `Salida exigente: ${Math.round(elev)} m de desnivel acumulado (${elevPerKm.toFixed(0)} m/km).`, tone: 'warning' });
  } else if (elev > 0) {
    insights.push({ text: 'El desnivel fue bajo y no afectó tu rendimiento.', tone: 'positive' });
  }

  // 4) Ranking by pace within the distance bucket.
  const bucketRuns = [...similar, activity].sort((a, b) => paceSecPerKm(a) - paceSecPerKm(b));
  const rank = bucketRuns.findIndex(a => a.id === activity.id) + 1;
  if (similar.length >= 3 && rank <= 3) {
    insights.push({ text: `Top ${ordinal(rank)} por ritmo entre tus salidas de ${bucket}.`, tone: 'positive' });
  }

  return insights.slice(0, 4);
}

// ── Highlight mini-cards ─────────────────────────────────────────────────────
//
// Tres tarjetas, en el orden en que se leen: lo propio de esta salida primero,
// después el ritmo reciente (ventana móvil de 7 días, no casillero de calendario
// — evita que el mismo bloque de entrenamiento se lea distinto según qué día de
// la semana caiga hoy), y por último el contexto del bloque de 4 semanas.

function buildHighlights(
  activity: Activity,
  allRuns: Activity[],
  recentWeeklyAvgKm: number
): HighlightCard[] {
  const cards: HighlightCard[] = [];
  const km = activity.distance / 1000;
  const bucket = distanceBucketLabel(km);
  const now = new Date();

  // Ranking dentro del bucket de distancia, con el ritmo que lo sostiene.
  const similar = allRuns.filter(a => Math.abs(a.distance / 1000 - km) <= 2.5 && paceSecPerKm(a) > 0);
  if (similar.length >= 3) {
    const sorted = [...similar].sort((a, b) => paceSecPerKm(a) - paceSecPerKm(b));
    const rank = sorted.findIndex(a => a.id === activity.id) + 1;
    if (rank > 0) {
      cards.push({
        icon: 'medal',
        value: formatPace(paceSecPerKm(activity)),
        label: 'por ritmo promedio',
        sub: `Top ${rank} de tus ${bucket}`,
        tone: rank <= 3 ? 'positive' : 'neutral',
      });
    }
  }

  // Últimos 7 días contra los 7 previos.
  const last7Km = kmInTrailingDays(allRuns, now, 7, 0);
  const prev7Km = kmInTrailingDays(allRuns, now, 7, 7);
  const deltaPct = prev7Km > 0.5 ? Math.round(((last7Km - prev7Km) / prev7Km) * 100) : null;
  cards.push({
    icon: 'route',
    value: `${last7Km.toFixed(1)} km`,
    label: 'últimos 7 días',
    sub: deltaPct !== null
      ? `${deltaPct >= 0 ? '+' : ''}${deltaPct}% vs. los 7 previos`
      : 'primeros 7 días con registro',
    tone: deltaPct !== null && deltaPct < 0 ? 'warning' : 'positive',
  });

  // Media del bloque actual.
  cards.push({
    icon: 'calendar',
    value: `${recentWeeklyAvgKm} km`,
    label: 'promedio semanal',
    sub: 'media de las últimas 4 semanas',
    tone: 'neutral',
  });

  return cards;
}

// ── Agenda: Ayer + Hoy + próximas 72h ────────────────────────────────────────

const PLAN_LABELS: Record<string, string> = {
  easy: 'Trote suave 5–8K',
  run: 'Salida cómoda 8–10K',
  larga: 'Salida larga 15K+',
  tempo: 'Rodaje con tramo a ritmo',
  velocidad: 'Series de velocidad',
  rest: 'Descanso',
};

// 3-day templates seeded by the coach recommendation for the day after today.
const PLAN_TEMPLATES: Record<string, string[]> = {
  descanso: ['rest', 'easy', 'run'],
  regenerativa: ['easy', 'rest', 'run'],
  normal: ['run', 'rest', 'easy'],
  larga: ['larga', 'rest', 'easy'],
  tempo: ['tempo', 'rest', 'run'],
  velocidad: ['velocidad', 'rest', 'easy'],
};

function buildAgenda(activities: Activity[], stats: ProcessedStats): DayPlan[] {
  const rec = computeCoachRecommendation(activities, stats);
  const now = new Date();
  const runs = activities.filter(isRun);

  // ── Días ya transcurridos: se informa lo que pasó, no lo que se planeaba ──
  const pastDay = (date: Date, day: string, emptyLabel: string): DayPlan => {
    const km = kmOnDay(runs, date);
    return km > 0
      ? { day, label: `Corriste ${km.toFixed(1)} km`, kind: 'done' }
      : { day, label: emptyLabel, kind: 'none' };
  };

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  // ── Next 72h (3 upcoming days) ──
  const template = PLAN_TEMPLATES[rec.type];
  const upcoming: DayPlan[] = template.map((code, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() + i + 1);
    const dayName = i === 0 ? 'Mañana' : WEEKDAYS[d.getDay()];
    return {
      day: dayName,
      label: PLAN_LABELS[code],
      kind: code === 'rest' ? 'rest' : 'run',
    };
  });

  return [
    pastDay(yesterday, 'Ayer', 'Sin salida'),
    pastDay(now, 'Hoy', 'Sin salida todavía'),
    ...upcoming,
  ];
}

// ── Main export ──────────────────────────────────────────────────────────────

export function computeCoachAnalisis(
  activities: Activity[],
  stats: ProcessedStats
): CoachAnalisis | null {
  const enriched = computeEnrichedLastActivity(activities, stats);
  if (!enriched) return null;

  const allRuns = activities.filter(isRun);
  const last = enriched.activity;

  const forma = computeFormShape(activities, stats);
  const recentWeeklyAvgKm = forma?.recentWeeklyAvgKm ?? Math.round(stats.weeklyAvgDistance * 10) / 10;

  const activity: AnalisisActivity = {
    name: last.name,
    dateTimeLabel: formatDateTime(last.start_date_local),
    dateLabel: formatDate(last.start_date_local),
    distanceKm: enriched.distanceKm,
    durationLabel: formatClock(last.moving_time),
    pace: enriched.pace,
    polyline: last.map?.summary_polyline ?? null,
    stravaUrl: enriched.stravaUrl,
  };

  return {
    activity,
    insights: buildInsights(last, allRuns),
    highlights: buildHighlights(last, allRuns, recentWeeklyAvgKm),
    agenda: buildAgenda(activities, stats),
  };
}
