import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';

const RUNNING_SPORTS = new Set(['Run', 'TrailRun', 'VirtualRun']);
const WEEKDAY_NAMES_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export interface SmartInsight {
  id: string;
  text: string;
}

export function generateSmartInsights(
  activities: StravaActivity[],
  stats: ProcessedStats
): SmartInsight[] {
  const insights: SmartInsight[] = [];

  // 1. Best day of week (most frequent)
  if (stats.weekdayDistribution.length > 0) {
    const sorted = [...stats.weekdayDistribution].sort((a, b) => b.count - a.count);
    const top = sorted[0];
    if (top.count >= 3) {
      insights.push({
        id: 'top_day',
        text: `Los ${WEEKDAY_NAMES_ES[top.day]} son tu día más frecuente de entrenamiento, con ${top.count} salidas registradas.`,
      });
    }
  }

  // 2. Distance growth vs 3 months ago
  if (stats.monthly.length >= 6) {
    const recent3km = stats.monthly.slice(-3).reduce((s, m) => s + m.distance, 0);
    const prev3km = stats.monthly.slice(-6, -3).reduce((s, m) => s + m.distance, 0);
    if (prev3km > 0) {
      const pct = Math.round(((recent3km - prev3km) / prev3km) * 100);
      if (pct >= 10) {
        insights.push({
          id: 'distance_growth',
          text: `Corrés un ${pct}% más distancia que hace tres meses (${Math.round(recent3km)} km vs ${Math.round(prev3km)} km).`,
        });
      } else if (pct <= -10) {
        insights.push({
          id: 'distance_decline',
          text: `Tu volumen bajó un ${Math.abs(pct)}% respecto a los tres meses anteriores. Puede ser una fase de recuperación.`,
        });
      }
    }
  }

  // 3. Best hour range for pace
  const runsByHour: { hour: number; paces: number[] }[] = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    paces: [],
  }));
  for (const act of activities) {
    if (RUNNING_SPORTS.has(act.sport_type || act.type) && act.average_speed > 0 && act.distance >= 2000) {
      const h = parseInt(act.start_date_local.slice(11, 13), 10);
      runsByHour[h].paces.push(1000 / act.average_speed);
    }
  }
  const qualified = runsByHour.filter(h => h.paces.length >= 3);
  if (qualified.length >= 2) {
    const best = qualified.reduce((a, b) => {
      const avgA = a.paces.reduce((s, p) => s + p, 0) / a.paces.length;
      const avgB = b.paces.reduce((s, p) => s + p, 0) / b.paces.length;
      return avgA < avgB ? a : b;
    });
    insights.push({
      id: 'best_hour',
      text: `Tus mejores ritmos aparecen cuando entrenás alrededor de las ${best.hour}:00 hs.`,
    });
  }

  // 4. Record month detection
  if (stats.monthly.length >= 2) {
    const currentMonthPrefix = (() => {
      const now = new Date();
      return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    })();
    const currentMonth = stats.monthly.find(m => m.month === currentMonthPrefix);
    if (currentMonth && currentMonth.distance > 0) {
      const maxEver = Math.max(...stats.monthly.map(m => m.distance));
      if (currentMonth.distance === maxEver) {
        insights.push({
          id: 'record_month',
          text: `Tu volumen actual es el más alto del historial: ${Math.round(currentMonth.distance)} km este mes.`,
        });
      }
    }
  }

  // 5. Weekly consistency streak
  const recent8 = stats.weekly.slice(-8);
  const active8 = recent8.filter(w => w.count > 0).length;
  if (recent8.length >= 8 && active8 >= 7) {
    insights.push({
      id: 'consistency_streak',
      text: `Entrenaste en ${active8} de las últimas 8 semanas. Tu constancia es uno de tus puntos más fuertes.`,
    });
  }

  // 6. Pace improvement trend
  if (stats.paceEvolution.length >= 10) {
    const first5avg = stats.paceEvolution.slice(0, 5).reduce((s, p) => s + p.pace, 0) / 5;
    const last5avg = stats.paceEvolution.slice(-5).reduce((s, p) => s + p.pace, 0) / 5;
    const diffSec = Math.round(first5avg - last5avg);
    if (diffSec >= 15) {
      const m = Math.floor(diffSec / 60);
      const s = diffSec % 60;
      const label = m > 0 ? `${m} min ${s > 0 ? s + ' seg' : ''}` : `${s} seg`;
      insights.push({
        id: 'pace_improved',
        text: `Tu ritmo mejoró ${label} por km desde tus primeras salidas registradas.`,
      });
    }
  }

  // 7. Longest run context
  if (stats.longestActivity >= 21) {
    insights.push({
      id: 'long_run',
      text: `Ya completaste una distancia de media maratón o más. Tu rango de distancia es de nivel avanzado.`,
    });
  } else if (stats.longestActivity >= 10) {
    insights.push({
      id: 'long_run',
      text: `Tu carrera más larga es de ${Math.round(stats.longestActivity * 10) / 10} km. Estás en buen camino hacia distancias mayores.`,
    });
  }

  return insights.slice(0, 5);
}

// Legacy function kept for backward compatibility
export function generateInsights(stats: ProcessedStats): string[] {
  const insights: string[] = [];
  const { weeklyAvgDistance, bestPace, currentStreak, longestStreak, monthly, sportDistribution } = stats;

  if (weeklyAvgDistance >= 30) {
    insights.push(`Promediás ${weeklyAvgDistance.toFixed(1)} km por semana. Buen volumen de entrenamiento.`);
  } else if (weeklyAvgDistance > 0) {
    insights.push(`Promediás ${weeklyAvgDistance.toFixed(1)} km por semana.`);
  }

  if (currentStreak >= 7) {
    insights.push(`¡Racha activa de ${currentStreak} días consecutivos!`);
  } else if (currentStreak >= 3) {
    insights.push(`Llevás ${currentStreak} días activos seguidos.`);
  }

  if (longestStreak >= 14) {
    insights.push(`Tu racha más larga fue de ${longestStreak} días.`);
  }

  if (monthly.length >= 2) {
    const last = monthly[monthly.length - 1];
    const prev = monthly[monthly.length - 2];
    if (last.distance > prev.distance * 1.2) {
      insights.push(`Este mes corriste un ${Math.round(((last.distance - prev.distance) / prev.distance) * 100)}% más que el mes anterior.`);
    }
  }

  const topHour = stats.hourlyDistribution.reduce((a, b) => (a.count > b.count ? a : b), stats.hourlyDistribution[0]);
  if (topHour) {
    insights.push(`Tu hora de entrenamiento más frecuente es a las ${topHour.label}.`);
  }

  return insights.slice(0, 5);
}
