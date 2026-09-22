import { Activity } from '@/types/activity';

/**
 * El orden del historial completo. Es lo único que este módulo decide: qué
 * significa "ordenado por ritmo" cuando hay actividades sin ritmo, y qué pasa
 * cuando dos valores empatan.
 *
 * Vive separado del componente porque es una decisión de producto —una salida
 * sin velocidad media no es la más rápida ni la más lenta, es una ausencia— y
 * porque una decisión se testea.
 */

export type ActivitySortKey = 'fecha' | 'distancia' | 'ritmo' | 'desnivel';

export interface ActivitySortOption {
  id: ActivitySortKey;
  label: string;
}

/** El orden en que se ofrecen. `fecha` es el default: el historial es cronológico. */
export const ACTIVITY_SORTS: ActivitySortOption[] = [
  { id: 'fecha', label: 'Más recientes' },
  { id: 'distancia', label: 'Más largas' },
  { id: 'ritmo', label: 'Más rápidas' },
  { id: 'desnivel', label: 'Más desnivel' },
];

/** Desempate único y estable: sin esto el orden cambia entre renders. */
function byDateDesc(a: Activity, b: Activity): number {
  const diff = b.start_date_local.localeCompare(a.start_date_local);
  return diff !== 0 ? diff : b.externalId.localeCompare(a.externalId);
}

/**
 * Una actividad sin `average_speed` no tiene ritmo que comparar. No se la
 * trata como infinitamente lenta (quedaría última fingiendo un dato) ni como
 * infinitamente rápida: se la manda al final del orden por ritmo, donde su
 * posición no afirma nada.
 */
function hasPace(a: Activity): boolean {
  return a.average_speed > 0;
}

export function sortActivities(
  activities: Activity[],
  key: ActivitySortKey
): Activity[] {
  const sorted = [...activities];

  switch (key) {
    case 'fecha':
      return sorted.sort(byDateDesc);

    case 'distancia':
      return sorted.sort((a, b) => b.distance - a.distance || byDateDesc(a, b));

    case 'desnivel':
      return sorted.sort(
        (a, b) => b.total_elevation_gain - a.total_elevation_gain || byDateDesc(a, b)
      );

    case 'ritmo':
      return sorted.sort((a, b) => {
        if (hasPace(a) !== hasPace(b)) return hasPace(a) ? -1 : 1;
        if (!hasPace(a)) return byDateDesc(a, b);
        return b.average_speed - a.average_speed || byDateDesc(a, b);
      });
  }
}
