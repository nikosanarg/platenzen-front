import { Activity } from '@/types/activity';
import { isRunning } from '@/lib/sports';
import { metersToKm } from '@/utils/units';
import { localDateKey } from '@/utils/localDate';

/**
 * El ranking del club y la ficha pública miden lo mismo: los últimos 90 días.
 * Es decisión del PO que el dato "venza" — una salida de hace cuatro meses ya
 * no suma —, así que una posición se sostiene corriendo, no acumulando
 * historial. Ver `docs/club.md`.
 */
export const VENTANA_DIAS = 90;

/**
 * Las ligas salen de la racha semanal actual (`computeWeeklyStreak`), con
 * cualquier deporte: una salida en la semana alcanza para sostenerla. El orden
 * de este arreglo es el de la tabla, de la más alta a la más baja.
 */
export type Liga = 'oro' | 'plata' | 'bronce';

export const LIGAS: readonly { id: Liga; label: string; criterio: string }[] = [
  { id: 'oro', label: 'Liga Oro', criterio: '12 semanas seguidas o más' },
  { id: 'plata', label: 'Liga Plata', criterio: 'De 4 a 11 semanas seguidas' },
  { id: 'bronce', label: 'Liga Bronce', criterio: 'Menos de 4 semanas seguidas' },
];

const SEMANAS_PLATA = 4;
const SEMANAS_ORO = 12;

export function ligaPorRacha(semanas: number): Liga {
  if (semanas >= SEMANAS_ORO) return 'oro';
  if (semanas >= SEMANAS_PLATA) return 'plata';
  return 'bronce';
}

/**
 * Si un día local (`YYYY-MM-DD`) cae en los últimos `dias` días, hoy incluido.
 * Una sola definición de la ventana para las actividades y para los días del
 * mapa de calor: si no, una salida podría contar en uno y no en el otro.
 */
export function enVentana(
  dia: string,
  now: Date = new Date(),
  dias: number = VENTANA_DIAS
): boolean {
  const desde = new Date(now);
  desde.setDate(desde.getDate() - (dias - 1));
  return dia >= localDateKey(desde) && dia <= localDateKey(now);
}

export function actividadesEnVentana(activities: Activity[], now: Date = new Date()): Activity[] {
  return activities.filter(a => enVentana(a.start_date_local.slice(0, 10), now));
}

/** Los tres números por los que se ordena el ranking. Sólo running. */
export interface ResumenVentana {
  distanciaKm: number;
  actividades: number;
  /**
   * Segundos por km sobre el total de la ventana (tiempo total / distancia
   * total), no el promedio de los ritmos de cada salida: así una salida de 3 km
   * no pesa lo mismo que una de 21. `null` sin salidas con ritmo medido.
   */
  ritmoSegKm: number | null;
}

export function resumenRunning(activities: Activity[]): ResumenVentana {
  const runs = activities.filter(isRunning);
  const conRitmo = runs.filter(a => a.average_speed > 0 && a.distance > 0);
  const kmConRitmo = conRitmo.reduce((s, a) => s + metersToKm(a.distance), 0);
  const segundos = conRitmo.reduce((s, a) => s + a.moving_time, 0);

  return {
    distanciaKm: runs.reduce((s, a) => s + metersToKm(a.distance), 0),
    actividades: runs.length,
    ritmoSegKm: kmConRitmo > 0 ? segundos / kmConRitmo : null,
  };
}

/** Una fila del ranking: lo que devuelve platenzen-api (`EntradaRanking`) por cada corredor. */
export interface RankingEntry extends ResumenVentana {
  id: string;
  /** `null` cuando no se conoce: la fila propia, armada con los datos locales. */
  nombre: string | null;
  rachaSemanas: number;
  liga: Liga;
  /** ISO 3166-1 alfa-2, si el corredor lo eligió. */
  pais?: string | null;
  /** La fila de quien mira. */
  esPropio?: boolean;
  /** Lo que va en `/hero/<enlace>`: el usuario o el alias. Sin él (fila local), no hay ficha pública. */
  enlace?: string;
  /** Si la fila abre una ficha: el corredor puede aparecer en la tabla sin mostrarla. */
  fichaVisible?: boolean;
}

export type RankingSortKey = 'distancia' | 'ritmo' | 'actividades';

/** El orden en que se ofrecen. `distancia` es el default. */
export const RANKING_SORTS: readonly { id: RankingSortKey; label: string }[] = [
  { id: 'distancia', label: 'Distancia' },
  { id: 'ritmo', label: 'Ritmo' },
  { id: 'actividades', label: 'Actividades' },
];

/**
 * Los empates se resuelven por distancia y después por `id`, para que el
 * orden sea estable entre renders. Sin ritmo medido no se es ni el más rápido
 * ni el más lento: se va al final, donde la posición no afirma nada.
 */
export function sortRanking(entries: RankingEntry[], key: RankingSortKey): RankingEntry[] {
  const desempate = (a: RankingEntry, b: RankingEntry) =>
    b.distanciaKm - a.distanciaKm || a.id.localeCompare(b.id);

  return [...entries].sort((a, b) => {
    switch (key) {
      case 'distancia':
        return desempate(a, b);
      case 'actividades':
        return b.actividades - a.actividades || desempate(a, b);
      case 'ritmo':
        if ((a.ritmoSegKm === null) !== (b.ritmoSegKm === null)) return a.ritmoSegKm === null ? 1 : -1;
        if (a.ritmoSegKm === null || b.ritmoSegKm === null) return desempate(a, b);
        return a.ritmoSegKm - b.ritmoSegKm || desempate(a, b);
    }
  });
}
