import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';
import { HALF_MARATHON_KM } from '@/lib/distances';

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
        text: `Los ${WEEKDAY_NAMES_ES[top.day]}s son tu día de más salidas (${top.count})`,
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
          text: `Corrés ${pct}% más que hace 3 meses (${Math.round(recent3km)} km vs ${Math.round(prev3km)} km)`,
        });
      } else if (pct <= -10) {
        insights.push({
          id: 'distance_decline',
          text: `Tu volumen bajó un ${Math.abs(pct)}% respecto a los 3 meses anteriores. Puede ser una fase de recuperación`,
        });
      }
    }
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
          text: `Tu volumen actual es el más alto del historial: ${Math.round(currentMonth.distance)} km este mes`,
        });
      } else {
        insights.push({
          id: 'record_month',
          text: `Tu volumen más alto fue de ${Math.round(maxEver)} km en un mes anterior. Este mes llevás ${Math.round(currentMonth.distance)} km`,
        });
      }
    }
  }

  // 5. Weekly consistency streak
  let recentQuantity = 32; // look at last 32 weeks
  const recent = stats.weekly.slice(-recentQuantity);
  const active = recent.filter(w => w.count > 0).length;
  if (active >= recentQuantity / 2) {
    insights.push({
      id: 'consistency_streak',
      text: `Entrenaste ${active} semanas de las últimas ${recentQuantity} semanas`,
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
        text: `Tu ritmo mejoró ${label} por km desde tus primeras salidas registradas`,
      });
    }
  }

  // 7. Longest run context
  if (stats.longestActivity >= HALF_MARATHON_KM) {
    insights.push({
      id: 'long_run',
      text: `Ya alcanzaste una distancia de media maratón o más (${Math.round(stats.longestActivity * 10) / 10} km)`,
    });
  } else if (stats.longestActivity >= 10) {
    insights.push({
      id: 'long_run',
      text: `Tu carrera más larga es de ${Math.round(stats.longestActivity * 10) / 10} km`,
    });
  }

  return insights.slice(0, 5);
}
