/**
 * El contrato canónico de actividad de Platenzen.
 *
 * Es deliberadamente el vocabulario que el dominio YA hablaba cuando Strava era
 * el único proveedor: `distance` en metros, `moving_time` en segundos,
 * `average_speed` en m/s. No se renombró nada. Los ~30 módulos de `src/lib` y
 * `src/utils` que consumen actividades son la definición de facto de qué
 * significa una actividad acá, y traducirlos a nombres "neutrales" habría sido
 * churn sin lector: el nombre `moving_time` no es peor que `movingTimeSeconds`,
 * sólo distinto, y el costo de cambiarlo se paga en 30 archivos a cambio de
 * nada.
 *
 * Lo que sí es nuevo son `provider` y `externalId`, y son la razón de que este
 * archivo exista: **la identidad de una actividad es el par `provider +
 * externalId`, no el `id`**. Dos proveedores pueden emitir el mismo número.
 *
 * Un `Activity` sólo se construye desde un adapter de proveedor
 * (`src/services/providers/*`). Por eso `provider` y `externalId` son
 * obligatorios: sin una vía de construcción que los exija, se cuela una
 * actividad sin origen y la deduplicación deja de ser confiable justo cuando
 * hay dos proveedores conectados, que es cuando importa.
 */

/** Proveedores que Platenzen sabe leer. Se agrega uno cuando existe su adapter. */
export type ProviderId = 'strava' | 'garmin';

export interface Activity {
  /** De qué proveedor vino. Mitad de la identidad. */
  provider: ProviderId;
  /**
   * El id de la actividad tal como lo emite el proveedor, siempre string.
   * La otra mitad de la identidad, y la clave de deduplicación.
   * Strava: `id` numérico convertido a string. Garmin: `summaryId`.
   */
  externalId: string;

  /**
   * Id numérico heredado de Strava. Se conserva porque el código existente lo
   * usa como key de React y en comparaciones, y porque Garmin también emite un
   * `activityId` numérico que encaja acá.
   *
   * **No lo uses para identidad ni para deduplicar** — para eso está
   * `provider + externalId`. Nada garantiza que no colisione entre proveedores.
   */
  id: number;

  name: string;
  /** Vocabulario de Strava (`Run`, `TrailRun`, `VirtualRun`, `Ride`, …). Ver `src/lib/sports.ts`. */
  type: string;
  /** Idem `type`, más específico. Los adapters de otros proveedores mapean HACIA este vocabulario. */
  sport_type: string;

  /** Metros. */
  distance: number;
  /** Segundos. */
  moving_time: number;
  /** Segundos. */
  elapsed_time: number;
  /** Metros de desnivel positivo acumulado. */
  total_elevation_gain: number;

  /** ISO 8601 en UTC, con `Z`. Ej: `2026-05-25T21:13:24Z`. */
  start_date: string;
  /**
   * Hora local de pared, en formato ISO **pero con un sufijo `Z` que miente**.
   * Ej: una salida de las 18:13 en Buenos Aires es `2026-05-25T18:13:24Z`.
   *
   * No es un error heredado que convenga arreglar: es el contrato que el
   * dominio lee de las dos maneras posibles —cortando el string
   * (`stats.ts:36`) y con `new Date()` (`utils/grouping.ts:26`)— y las dos dan
   * la hora local correcta sólo gracias a ese `Z`. Un adapter que emita el
   * offset real (`-03:00`) corre las actividades tres horas en el mapa de calor
   * y en la distribución horaria, en silencio y sólo para ese proveedor.
   */
  start_date_local: string;

  /** m/s. El ritmo se deriva de acá (`utils/pace.ts`), no viene del proveedor. */
  average_speed: number;
  /** m/s. */
  max_speed: number;

  average_heartrate?: number;
  max_heartrate?: number;

  /**
   * Traza GPS como polyline codificada de Google. Es el formato nativo de
   * Strava; los adapters que reciben coordenadas sueltas las codifican
   * (`src/lib/polylineEncoder.ts`) en vez de que el dominio aprenda un segundo
   * formato — `worldMap`, `explorationUtils`, `CoachAnalisis` y
   * `UltimaActividad` decodifican con `decodePolyline` y no se enteran del
   * proveedor.
   */
  map?: {
    summary_polyline?: string;
  };

  /**
   * Métricas sociales de Strava. Opcionales porque son de Strava y de nadie
   * más: Garmin no tiene kudos. Hoy ningún cálculo las lee; se conservan
   * porque ya venían en el payload y sacarlas no le devuelve nada a nadie.
   */
  kudos_count?: number;
  athlete_count?: number;
}
