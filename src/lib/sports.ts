/**
 * Qué cuenta como correr, en un solo lugar.
 *
 * Este Set estaba copiado literalmente en 16 archivos de `src/lib`. Que
 * estuvieran todos de acuerdo era suerte, no diseño: agregar un tipo de carrera
 * nuevo obligaba a acordarse de 16 lugares, y olvidarse de uno no rompe nada
 * visible — sólo deja una actividad afuera de un cálculo y adentro de otro.
 *
 * El vocabulario es el de Strava, y eso es a propósito: es el que el dominio ya
 * hablaba. Los adapters de otros proveedores traducen HACIA acá
 * (`src/services/providers/*`), no al revés. Ver `src/types/activity.ts`.
 */

export const RUNNING_SPORTS: ReadonlySet<string> = new Set([
  'Run',
  'TrailRun',
  'VirtualRun',
]);

/** Lo mínimo que hace falta para clasificar. Sirve para `Activity` y para payloads crudos. */
interface Deportiva {
  type: string;
  sport_type?: string;
}

/**
 * `sport_type` es el campo específico y `type` el genérico; Strava manda los
 * dos y el segundo es el respaldo para actividades viejas donde `sport_type`
 * llega vacío.
 */
export function deporte(a: Deportiva): string {
  return a.sport_type || a.type;
}

export function isRunning(a: Deportiva): boolean {
  return RUNNING_SPORTS.has(deporte(a));
}

export function isTrailRun(a: Deportiva): boolean {
  return deporte(a) === 'TrailRun';
}
