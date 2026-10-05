import { Activity } from '@/types/activity';
import { ProcessedStats } from '@/types/stats';
import { HeroProfile, buildHeroProfile } from '@/lib/heroProfile';
import { actividadesEnVentana } from '@/lib/ranking';
import { isRunning } from '@/lib/sports';
import { metersToKm } from '@/utils/units';
import { localDateKey, lunesDe } from '@/utils/localDate';

/**
 * Lo único que sale del dispositivo hacia el club. Todo derivado: la ficha ya
 * calculada (con los nombres de las salidas reemplazados, ver
 * `etiquetaPublica`), el running sumado por día dentro de la ventana, y qué
 * semanas tuvieron actividad. Ni actividades, ni trazas, ni ids de Strava.
 *
 * La API vuelve a validar todo (`validarPublicacion` en platenzen-api) y
 * calcula el ranking con los mismos criterios que `src/lib/ranking.ts`.
 */
export interface DiaRunning {
  dia: string;
  km: number;
  salidas: number;
  kmConRitmo: number;
  segConRitmo: number;
}

export interface Publicacion {
  ficha: HeroProfile;
  dias: DiaRunning[];
  semanasActivas: string[];
}

/** Lo mismo que mira la racha en la API (`SEMANAS_HISTORIA`): tres años. */
const SEMANAS_HISTORIA = 156;

const redondear = (n: number) => Math.round(n * 1000) / 1000;

/** Running de la ventana, sumado por día local. Mismo criterio de ritmo que `resumenRunning`. */
export function diasRunning(activities: Activity[], now: Date = new Date()): DiaRunning[] {
  const porDia = new Map<string, DiaRunning>();
  for (const a of actividadesEnVentana(activities, now).filter(isRunning)) {
    const dia = a.start_date_local.slice(0, 10);
    const d = porDia.get(dia) ?? { dia, km: 0, salidas: 0, kmConRitmo: 0, segConRitmo: 0 };
    d.km += metersToKm(a.distance);
    d.salidas += 1;
    if (a.average_speed > 0 && a.distance > 0) {
      d.kmConRitmo += metersToKm(a.distance);
      d.segConRitmo += a.moving_time;
    }
    porDia.set(dia, d);
  }
  return [...porDia.values()]
    .map(d => ({ ...d, km: redondear(d.km), kmConRitmo: redondear(d.kmConRitmo) }))
    .sort((a, b) => a.dia.localeCompare(b.dia));
}

/** Lunes de cada semana con al menos una actividad de cualquier deporte. */
export function semanasActivas(stats: ProcessedStats, now: Date = new Date()): string[] {
  const desde = new Date(now);
  desde.setDate(desde.getDate() - 7 * SEMANAS_HISTORIA);
  const desdeKey = localDateKey(desde);
  const hoy = localDateKey(now);
  const lunes = new Set(
    stats.daily.filter(d => d.count > 0 && d.date >= desdeKey && d.date <= hoy).map(d => lunesDe(d.date))
  );
  return [...lunes].sort();
}

export function construirPublicacion(
  activities: Activity[],
  stats: ProcessedStats,
  now: Date = new Date()
): Publicacion {
  return {
    // Sin nombre: lo pone la API con el que el corredor eligió (o su alias).
    ficha: buildHeroProfile(activities, stats, now, null, true),
    dias: diasRunning(activities, now),
    semanasActivas: semanasActivas(stats, now),
  };
}
