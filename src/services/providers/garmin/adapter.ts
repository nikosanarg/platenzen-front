import type { Activity } from '@/types/activity';
import { encodePolyline } from '@/lib/polylineEncoder';
import type { GarminActivityDetails, GarminActivitySummary, GarminSample } from './types';
import { sportTypeDeGarmin, tipoDeGarmin } from './sportTypes';

/**
 * Traduce un payload de Garmin a `Activity`, el contrato canónico de
 * Platenzen (`src/types/activity.ts`). Es una función pura: no hace fetch,
 * no conoce OAuth, no sabe que existe un backend. Ver el primer bloque de
 * `docs/plan-frente-c-garmin.md` para por qué este adapter no se enchufa a
 * la app todavía.
 *
 * `details` es opcional porque el push de Garmin entrega el summary y los
 * detalles (samples, laps) por separado; sin ellos igual se puede construir
 * un `Activity` válido, sólo que sin `map.summary_polyline` y con
 * `moving_time` aproximado por `durationInSeconds`.
 */
export function toActivity(
  summary: GarminActivitySummary,
  details?: GarminActivityDetails,
): Activity {
  const distance = summary.distanceInMeters ?? 0;
  const elapsed_time = summary.durationInSeconds;

  const samples = details?.samples ?? [];
  const lastSample = samples.length > 0 ? samples[samples.length - 1] : undefined;
  const moving_time = lastSample?.movingDurationInSeconds ?? summary.durationInSeconds;

  const average_speed =
    summary.averageSpeedInMetersPerSecond ??
    (elapsed_time > 0 ? distance / elapsed_time : 0);

  const localMs = (summary.startTimeInSeconds + summary.startTimeOffsetInSeconds) * 1000;
  const start_date = formatoSinMilisegundos(new Date(summary.startTimeInSeconds * 1000));
  // La trampa: sumamos el offset ANTES de formatear y dejamos el sufijo `Z`.
  // No es UTC real — es la hora local de pared disfrazada de UTC, que es el
  // contrato que `stats.ts:36` y `utils/grouping.ts:26` esperan. Ver el
  // comentario de `start_date_local` en `src/types/activity.ts`.
  const start_date_local = formatoSinMilisegundos(new Date(localMs));

  const sport_type = sportTypeDeGarmin(summary.activityType);
  const type = tipoDeGarmin(summary.activityType);

  const coords = coordenadasValidas(samples);
  const map = coords.length > 0 ? { summary_polyline: encodePolyline(coords) } : undefined;

  const activity: Activity = {
    provider: 'garmin',
    externalId: summary.summaryId,
    // No es identidad (ver el comentario de `id` en `Activity`): un 0 de
    // relleno es aceptable, inventar un número no lo es.
    id: summary.activityId ?? 0,
    name: nombreNoVacio(summary.activityName) ?? nombrePorDefecto(sport_type, summary.activityType),
    type,
    sport_type,
    distance,
    moving_time,
    elapsed_time,
    total_elevation_gain: summary.totalElevationGainInMeters ?? 0,
    start_date,
    start_date_local,
    average_speed,
    max_speed: summary.maxSpeedInMetersPerSecond ?? 0,
    // Nunca inventar: si Garmin no mandó el dato, queda `undefined`, no 0.
    average_heartrate: summary.averageHeartRateInBeatsPerMinute,
    max_heartrate: summary.maxHeartRateInBeatsPerMinute,
    // Garmin no tiene kudos ni conteo de atletas: kudos_count/athlete_count
    // se omiten (quedan `undefined`), no se ponen en 0.
  };

  if (map) {
    activity.map = map;
  }

  return activity;
}

/**
 * `true` cuando el summary es el contenedor de una actividad multideporte.
 * Sus hijos llegan por separado con `parentSummaryId` apuntando acá. Contar
 * el contenedor y los hijos duplica distancia y tiempo: quien sincronice
 * tiene que filtrar los contenedores ANTES de llamar a `toActivity`, no al
 * revés — por eso esto no vive adentro de `toActivity`. Una función que a
 * veces devuelve `Activity` y a veces nada (por ejemplo `null`) es peor de
 * usar que un filtro explícito del lado de quien orquesta la sincronización.
 */
export function esActividadContenedora(summary: GarminActivitySummary): boolean {
  return summary.isParent === true;
}

/** ISO 8601 sin milisegundos, con el sufijo `Z` que Strava también usa (nunca manda milisegundos). */
function formatoSinMilisegundos(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function nombreNoVacio(nombre: string | undefined): string | undefined {
  return nombre && nombre.trim().length > 0 ? nombre : undefined;
}

/** Filtra las muestras que tienen lat Y lon — una sin la otra no es una coordenada. */
function coordenadasValidas(samples: GarminSample[]): [number, number][] {
  const coords: [number, number][] = [];
  for (const s of samples) {
    if (s.latitudeInDegree !== undefined && s.longitudeInDegree !== undefined) {
      coords.push([s.latitudeInDegree, s.longitudeInDegree]);
    }
  }
  return coords;
}

/**
 * Etiqueta legible en español cuando Garmin no manda `activityName` (pasa con
 * algunas actividades sincronizadas automáticamente). Decisión propia de este
 * adapter, no del plan original — ver `docs/feedback-frente-c.md`. Para un
 * `sport_type` que Platenzen no reconoce, humaniza el `activityType` crudo de
 * Garmin en vez de mostrar un genérico sin información.
 */
const ETIQUETA_POR_SPORT_TYPE: Readonly<Record<string, string>> = {
  Run: 'Carrera',
  TrailRun: 'Trail running',
  VirtualRun: 'Carrera virtual',
  Ride: 'Ciclismo',
  Swim: 'Natación',
  Walk: 'Caminata',
  Hike: 'Senderismo',
  Workout: 'Actividad',
};

function nombrePorDefecto(sportType: string, activityTypeCrudo: string | undefined): string {
  const conocida = ETIQUETA_POR_SPORT_TYPE[sportType];
  if (conocida) return conocida;
  if (!activityTypeCrudo) return 'Actividad';
  return humanizarTipoCrudo(activityTypeCrudo);
}

/** `"STAND_UP_PADDLEBOARDING"` → `"Stand up paddleboarding"`. */
function humanizarTipoCrudo(activityTypeCrudo: string): string {
  const palabras = activityTypeCrudo.toLowerCase().split('_');
  return palabras
    .map((p, i) => (i === 0 ? p.charAt(0).toUpperCase() + p.slice(1) : p))
    .join(' ');
}
