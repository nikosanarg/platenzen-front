import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';
import { computeEnrichedLastActivity } from '@/lib/lastActivity';
import { computeFormShape } from '@/lib/formShape';
import { computeCoachRecommendation } from '@/lib/coach';

const RUNNING_SPORTS = new Set(['Run', 'TrailRun', 'VirtualRun']);

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

export interface BottomStat {
  icon: 'calendar' | 'route' | 'flame' | 'trend' | 'medal';
  label: string;
  value: string;
  sub: string;
  tone: InsightTone;
}

export interface CoachAnalisis {
  activity: AnalisisActivity;
  insights: Insight[];
  highlights: HighlightCard[];
  agenda: DayPlan[];
  bottomStats: BottomStat[];
  verdict: { title: string; detail: string };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function isRun(a: StravaActivity): boolean {
  return RUNNING_SPORTS.has(a.sport_type || a.type);
}

function paceSecPerKm(a: StravaActivity): number {
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

function distanceBucketLabel(km: number): string {
  return `${Math.round(km)}K`;
}

function ordinal(n: number): string {
  return `${n}`;
}

// ── Insight generation ───────────────────────────────────────────────────────

function buildInsights(activity: StravaActivity, allRuns: StravaActivity[]): Insight[] {
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

// ── Highlight mini-cards (middle bottom) ─────────────────────────────────────

function buildHighlights(
  activity: StravaActivity,
  allRuns: StravaActivity[],
  stats: ProcessedStats,
  volumeChangePct: number,
  recentWeeklyAvgKm: number
): HighlightCard[] {
  const cards: HighlightCard[] = [];
  const km = activity.distance / 1000;
  const bucket = distanceBucketLabel(km);

  // Volume trend.
  if (volumeChangePct !== 0) {
    const positive = volumeChangePct > 0;
    cards.push({
      icon: 'trend',
      value: `${positive ? '+' : ''}${volumeChangePct}%`,
      label: 'Volumen semanal',
      sub: `${recentWeeklyAvgKm} km/sem promedio`,
      tone: positive ? 'positive' : 'warning',
    });
  }

  // Ranking within distance bucket.
  const similar = allRuns.filter(a => Math.abs(a.distance / 1000 - km) <= 2.5 && paceSecPerKm(a) > 0);
  if (similar.length >= 3) {
    const sorted = [...similar].sort((a, b) => paceSecPerKm(a) - paceSecPerKm(b));
    const rank = sorted.findIndex(a => a.id === activity.id) + 1;
    if (rank > 0) {
      cards.push({
        icon: 'medal',
        value: `Top ${rank}`,
        label: `de tus ${bucket}`,
        sub: 'por ritmo promedio',
        tone: rank <= 3 ? 'positive' : 'neutral',
      });
    }
  }

  // Historic distance.
  cards.push({
    icon: 'route',
    value: `${Math.round(stats.totalDistance)} km`,
    label: 'históricos',
    sub: `${stats.totalActivities} salidas`,
    tone: 'neutral',
  });

  // Consistency streak (trailing active weeks).
  const activeWeeks = trailingActiveWeeks(stats);
  if (activeWeeks >= 2) {
    cards.push({
      icon: 'flame',
      value: `${activeWeeks} sem`,
      label: 'consistentes',
      sub: 'sin cortes de continuidad',
      tone: 'positive',
    });
  }

  return cards.slice(0, 4);
}

function trailingActiveWeeks(stats: ProcessedStats): number {
  let n = 0;
  for (let i = stats.weekly.length - 1; i >= 0; i--) {
    if (stats.weekly[i].count > 0) n++;
    else break;
  }
  return n;
}

// ── Agenda: Hoy + próximas 72h ───────────────────────────────────────────────

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

function buildAgenda(
  activities: StravaActivity[],
  stats: ProcessedStats,
  lastActivity: StravaActivity
): DayPlan[] {
  const rec = computeCoachRecommendation(activities, stats);
  const now = new Date();

  // ── "Hoy": did the athlete already run today? ──
  const lastDate = new Date(lastActivity.start_date_local);
  const ranToday = lastDate.toDateString() === now.toDateString();
  const today: DayPlan = ranToday
    ? { day: 'Hoy', label: `Corriste ${(lastActivity.distance / 1000).toFixed(1)} km`, kind: 'done' }
    : { day: 'Hoy', label: 'Sin salida todavía', kind: 'none' };

  // ── Next 72h (3 upcoming days) ──
  const template = PLAN_TEMPLATES[rec.type] ?? PLAN_TEMPLATES.normal;
  const upcoming: DayPlan[] = template.map((code, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() + i + 1);
    const dayName = i === 0 ? 'Mañana' : WEEKDAYS[d.getDay()];
    return {
      day: dayName,
      label: PLAN_LABELS[code] ?? PLAN_LABELS.run,
      kind: code === 'rest' ? 'rest' : 'run',
    };
  });

  return [today, ...upcoming];
}

// ── Bottom stat strip ────────────────────────────────────────────────────────

function buildBottomStats(
  stats: ProcessedStats,
  recentWeeklyAvgKm: number
): BottomStat[] {
  const stripLast = stats.weekly.slice(-2);
  const thisWeekKm = stripLast.length ? stripLast[stripLast.length - 1].distance : 0;
  const prevWeekKm = stripLast.length > 1 ? stripLast[0].distance : 0;
  const weekDeltaPct = prevWeekKm > 0.5 ? Math.round(((thisWeekKm - prevWeekKm) / prevWeekKm) * 100) : null;

  // Weekly streak: consecutive trailing weeks with ≥1 activity.
  const weekStreak = trailingActiveWeeks(stats);
  const streakSub = weekStreak >= 8 ? '¡Excelente!' : weekStreak >= 3 ? 'En marcha' : 'Sumá continuidad';

  return [
    {
      icon: 'route',
      label: 'Kilómetros esta semana',
      value: `${thisWeekKm.toFixed(1)} km`,
      sub: weekDeltaPct !== null
        ? `${weekDeltaPct >= 0 ? '+' : ''}${weekDeltaPct}% vs. semana anterior`
        : 'primera semana con registro',
      tone: weekDeltaPct !== null && weekDeltaPct < 0 ? 'warning' : 'positive',
    },
    {
      icon: 'trend',
      label: 'Promedio semanal (4 sem.)',
      value: `${recentWeeklyAvgKm} km`,
      sub: 'media de tu bloque actual',
      tone: 'neutral',
    },
    {
      icon: 'flame',
      label: 'Racha de actividad',
      value: `${weekStreak} ${weekStreak === 1 ? 'semana' : 'semanas'}`,
      sub: streakSub,
      tone: weekStreak >= 3 ? 'positive' : 'neutral',
    },
  ];
}

// ── Verdict footer ───────────────────────────────────────────────────────────

function buildVerdict(volumeChangePct: number, streak: number): { title: string; detail: string } {
  if (volumeChangePct > 10) {
    return {
      title: 'Vas por el camino correcto. Estás construyendo una base sólida y sostenida.',
      detail: 'La clave ahora: seguir sumando volumen con inteligencia y respetar los días de descanso.',
    };
  }
  if (volumeChangePct < -10) {
    return {
      title: 'Bajaste el volumen respecto al bloque anterior.',
      detail: streak > 0
        ? 'Aprovechá la racha activa para recuperar carga de forma gradual, sin saltos bruscos.'
        : 'Retomá con salidas cortas y regulares para reconstruir la base.',
    };
  }
  return {
    title: 'Mantenés una carga estable y consistente.',
    detail: 'Buen momento para consolidar el hábito antes de buscar un nuevo salto de volumen.',
  };
}

// ── Main export ──────────────────────────────────────────────────────────────

export function computeCoachAnalisis(
  activities: StravaActivity[],
  stats: ProcessedStats
): CoachAnalisis | null {
  const enriched = computeEnrichedLastActivity(activities, stats);
  if (!enriched) return null;

  const allRuns = activities.filter(isRun);
  const last = enriched.activity;

  const forma = computeFormShape(activities, stats);
  const volumeChangePct = forma?.volumeChangePct ?? 0;
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
    highlights: buildHighlights(last, allRuns, stats, volumeChangePct, recentWeeklyAvgKm),
    agenda: buildAgenda(activities, stats, last),
    bottomStats: buildBottomStats(stats, recentWeeklyAvgKm),
    verdict: buildVerdict(volumeChangePct, stats.currentStreak),
  };
}
