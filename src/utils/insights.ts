import { ProcessedStats } from '@/types/stats';
import { kmToString, secondsToHMS } from './units';
import { secPerKmToString } from './pace';

const RUNNING_SPORTS = new Set(['Run', 'TrailRun', 'VirtualRun']);

export function generateInsights(stats: ProcessedStats): string[] {
  const insights: string[] = [];
  const { totalActivities, totalDistance, weeklyAvgDistance, bestPace, currentStreak, longestStreak, monthly, sportDistribution } = stats;

  if (totalActivities === 0) return insights;

  if (weeklyAvgDistance >= 50) {
    insights.push(`Semana muy activa: promediás ${kmToString(weeklyAvgDistance)} por semana. Gran volumen de entrenamiento.`);
  } else if (weeklyAvgDistance >= 30) {
    insights.push(`Buen volumen semanal de ${kmToString(weeklyAvgDistance)}. Estás en un rango saludable de entrenamiento.`);
  } else if (weeklyAvgDistance > 0) {
    insights.push(`Promediás ${kmToString(weeklyAvgDistance)} por semana. Podés aumentar el volumen gradualmente.`);
  }

  if (bestPace > 0 && RUNNING_SPORTS.has(sportDistribution[0]?.sport ?? '')) {
    if (bestPace < 240) {
      insights.push(`Tu mejor ritmo es ${secPerKmToString(bestPace)}. Velocidad de alto rendimiento.`);
    } else if (bestPace < 300) {
      insights.push(`Ritmo máximo de ${secPerKmToString(bestPace)}. Muy buen nivel de velocidad.`);
    } else if (bestPace < 360) {
      insights.push(`Ritmo más rápido registrado: ${secPerKmToString(bestPace)}. Buen nivel para distancias largas.`);
    }
  }

  if (currentStreak >= 7) {
    insights.push(`¡Racha activa de ${currentStreak} días consecutivos! Excelente constancia.`);
  } else if (currentStreak >= 3) {
    insights.push(`Llevás ${currentStreak} días activos seguidos. Mantené el ritmo.`);
  }

  if (longestStreak >= 14) {
    insights.push(`Tu racha más larga fue de ${longestStreak} días. Una marca que muestra dedicación real.`);
  }

  if (monthly.length >= 2) {
    const last = monthly[monthly.length - 1];
    const prev = monthly[monthly.length - 2];
    if (last.distance > prev.distance * 1.2) {
      insights.push(`Este mes corriste ${kmToString(last.distance)}, un ${Math.round(((last.distance - prev.distance) / prev.distance) * 100)}% más que el mes anterior.`);
    } else if (last.distance < prev.distance * 0.7) {
      insights.push(`Este mes el volumen bajó a ${kmToString(last.distance)}. Puede ser un mes de recuperación.`);
    }
  }

  if (totalDistance >= 1000) {
    insights.push(`Acumulaste más de ${kmToString(Math.floor(totalDistance / 100) * 100)} en total. ¡Impresionante.`);
  }

  const runningSport = sportDistribution.find((s) => RUNNING_SPORTS.has(s.sport));
  if (runningSport && runningSport.count / totalActivities >= 0.8) {
    insights.push(`El ${Math.round((runningSport.count / totalActivities) * 100)}% de tus actividades son carreras. Sos principalmente runner.`);
  } else if (sportDistribution.length >= 3) {
    insights.push(`Practicás ${sportDistribution.length} deportes distintos. Gran variedad en tu entrenamiento.`);
  }

  const topHour = stats.hourlyDistribution.reduce((a, b) => (a.count > b.count ? a : b), stats.hourlyDistribution[0]);
  if (topHour) {
    const period = topHour.hour < 12 ? 'mañanero' : topHour.hour < 17 ? 'de tarde' : 'nocturno';
    insights.push(`Sos un deportista ${period}: tu hora favorita de entrenamiento es a las ${topHour.label}.`);
  }

  const topDay = stats.weekdayDistribution.reduce((a, b) => (a.count > b.count ? a : b), stats.weekdayDistribution[0]);
  if (topDay) {
    insights.push(`${topDay.label} es tu día más activo de la semana con ${topDay.count} actividades.`);
  }

  if (stats.totalTime > 0) {
    const totalHours = Math.round(stats.totalTime / 3600);
    insights.push(`Tiempo total de entrenamiento: ${secondsToHMS(stats.totalTime)} (${totalHours} horas en total).`);
  }

  return insights.slice(0, 6);
}
