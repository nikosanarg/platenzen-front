/**
 * Payloads de la Garmin Health/Activity API, tipados.
 *
 * En el push de la API los campos van en camelCase (algunos integradores
 * documentan exportaciones con PascalCase; ese no es el formato que llega por
 * webhook/push). Verificado contra la especificación de la Health REST API
 * de Garmin publicada por terceros — ver `docs/feedback-frente-c.md` para la
 * fuente exacta y qué campos pudieron confirmarse y cuáles no.
 *
 * Garmin no tiene un endpoint de "traeme mis actividades": entrega por push
 * a una callback URL, o por ping + pull. Estos tipos describen el payload de
 * ese push, no una respuesta de request/response tradicional. Ver el primer
 * bloque de `docs/plan-frente-c-garmin.md` para el porqué.
 *
 * Casi todo va opcional a propósito: Garmin omite el campo cuando el
 * dispositivo no lo midió, nunca manda cero de relleno. Un reloj sin GPS no
 * manda coordenadas; una corrida sin banda cardíaca no manda pulso. Tipar eso
 * como obligatorio empuja a inventar valores en el adapter, y el adapter no
 * inventa valores (ver `adapter.ts`).
 */

/**
 * Activity Summary — lo que llega en el push de actividades.
 * Es la unidad mínima para producir un `Activity` (`adapter.ts#toActivity`
 * acepta sólo el summary; `details` es un enriquecimiento opcional).
 */
export interface GarminActivitySummary {
  /** Identidad estable de la actividad. Es la fuente de `Activity.externalId`. */
  summaryId: string;
  /** Id numérico de la actividad en Garmin Connect. No siempre viene. */
  activityId?: number;
  activityName?: string;
  /** Enum de Garmin. Ver `sportTypes.ts` para la traducción hacia el vocabulario de Strava. */
  activityType: string;
  /** Epoch UTC, en SEGUNDOS (no milisegundos). */
  startTimeInSeconds: number;
  /** Offset local respecto de UTC, en segundos. Puede ser negativo. */
  startTimeOffsetInSeconds: number;
  durationInSeconds: number;
  distanceInMeters?: number;
  averageSpeedInMetersPerSecond?: number;
  maxSpeedInMetersPerSecond?: number;
  averageHeartRateInBeatsPerMinute?: number;
  maxHeartRateInBeatsPerMinute?: number;
  averagePaceInMinutesPerKilometer?: number;
  totalElevationGainInMeters?: number;
  activeKilocalories?: number;
  averageRunCadenceInStepsPerMinute?: number;
  steps?: number;
  deviceName?: string;
  /** `true` cuando esta actividad es un contenedor multideporte. Ver `esActividadContenedora` en `adapter.ts`. */
  isParent?: boolean;
  /** Presente en las actividades hijas de un multideporte; apunta al `summaryId` del contenedor. */
  parentSummaryId?: string;
  /** `true` cuando la actividad fue cargada a mano, no sincronizada de un dispositivo. */
  manual?: boolean;
}

/** Una muestra de la serie temporal de una actividad (Activity Details). */
export interface GarminSample {
  latitudeInDegree?: number;
  longitudeInDegree?: number;
  elevationInMeters?: number;
  heartRate?: number;
  speedMetersPerSecond?: number;
  stepsPerMinute?: number;
  powerInWatts?: number;
  totalDistanceInMeters?: number;
  timerDurationInSeconds?: number;
  clockDurationInSeconds?: number;
  movingDurationInSeconds?: number;
  /** Sic: Garmin lo escribe así, sin la segunda "s" de "Celsius". */
  airTemperatureCelcius?: number;
}

export interface GarminLap {
  startTimeInSeconds: number;
}

/** Activity Details — el payload separado con las series temporales y los laps. */
export interface GarminActivityDetails {
  summary: GarminActivitySummary;
  samples?: GarminSample[];
  laps?: GarminLap[];
}
