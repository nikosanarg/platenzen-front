/**
 * Traduce el `activityType` de Garmin al vocabulario canónico de
 * `src/lib/sports.ts`, que es el de Strava. Es deliberado: ese vocabulario
 * es el que el dominio ya hablaba antes de que existiera un segundo
 * proveedor, y los adapters traducen HACIA él, no al revés (ver
 * `src/types/activity.ts` y `src/lib/sports.ts`).
 *
 * Un `activityType` desconocido NO se fuerza a `'Run'`. `sportTypeDeGarmin`
 * devuelve el valor crudo de Garmin (o `'Workout'` si ni siquiera vino) para
 * que quede afuera de los cálculos de carrera — meter una sesión de yoga en
 * el promedio de ritmo del corredor es peor que no contarla. Ver
 * `docs/feedback-frente-c.md` para la discusión de esta decisión.
 */

/** `activityType` de Garmin → `sport_type` canónico, para los tipos que Platenzen reconoce. */
const GARMIN_TO_SPORT_TYPE: Readonly<Record<string, string>> = {
  RUNNING: 'Run',
  STREET_RUNNING: 'Run',
  TRACK_RUNNING: 'Run',
  TRAIL_RUNNING: 'TrailRun',
  ULTRA_RUNNING: 'TrailRun',
  TREADMILL_RUNNING: 'VirtualRun',
  INDOOR_RUNNING: 'VirtualRun',
  VIRTUAL_RUNNING: 'VirtualRun',
  OBSTACLE_COURSE_RACING: 'Run',
  CYCLING: 'Ride',
  ROAD_BIKING: 'Ride',
  MOUNTAIN_BIKING: 'Ride',
  INDOOR_CYCLING: 'Ride',
  LAP_SWIMMING: 'Swim',
  OPEN_WATER_SWIMMING: 'Swim',
  WALKING: 'Walk',
  HIKING: 'Hike',
};

/** Cuando Garmin no manda `activityType` en absoluto. No es lo mismo que un valor desconocido: acá ni siquiera hay dato. */
const TIPO_GENERICO = 'Workout';

/**
 * `sport_type` canónico para un `activityType` de Garmin.
 * Devuelve el valor tal cual de Garmin si no está en la tabla — nunca `'Run'`
 * de relleno — para que un tipo no reconocido quede fuera de los cálculos que
 * filtran por `RUNNING_SPORTS` en `src/lib/sports.ts`, en vez de ensuciarlos.
 */
export function sportTypeDeGarmin(activityType: string | undefined): string {
  if (!activityType) return TIPO_GENERICO;
  return GARMIN_TO_SPORT_TYPE[activityType] ?? activityType;
}

/**
 * `type` (el campo genérico de `Activity`) para un `activityType` de Garmin.
 * Platenzen usa `sport_type` como el específico y `type` como respaldo
 * (`deporte()` en `src/lib/sports.ts` lee `sport_type || type`), así que acá
 * alcanza con el mismo valor: Garmin no distingue un genérico de un
 * específico como hace Strava con actividades viejas.
 */
export function tipoDeGarmin(activityType: string | undefined): string {
  return sportTypeDeGarmin(activityType);
}
