import { toActivity as garminToActivity } from '@/services/providers/garmin/adapter';
import { toActivity as stravaToActivity } from '@/services/providers/strava/adapter';
import { computeStats } from '@/lib/stats';
import { computeRacePredictions } from '@/lib/racePredictor';
import { isRunning } from '@/lib/sports';
import { mergeActivities } from '@/lib/mergeActivities';
import type { StravaActivity } from '@/types/strava';
import type { GarminActivityDetails, GarminActivitySummary } from '@/services/providers/garmin/types';
import type { Activity } from '@/types/activity';

/**
 * La costura entre proveedores, que es lo único que no se podía testear
 * mientras cada frente corría aislado.
 *
 * El criterio de aceptación del pedido no es "Garmin sincroniza": es que una
 * actividad de Garmin **se comporte dentro de Platenzen igual que la
 * equivalente de Strava**, en todas las partes del producto que trabajan con
 * ese tipo de información. Así que estos tests no miran los adapters por
 * separado: describen la MISMA salida —una corrida de 7001.1 m en 2492 s el
 * 25/5/2026 a las 18:13 en Buenos Aires— en los dos formatos de origen, y
 * comprueban que el dominio real no las puede distinguir.
 *
 * Si alguna vez falla, lo que se rompió no es un adapter: es la promesa de que
 * la UI y los cálculos no necesitan saber de dónde vino el dato.
 */

const DISTANCIA_M = 7001.1;
const MOVING_S = 2492;
const ELAPSED_S = 2492;
const DESNIVEL_M = 30;
const VELOCIDAD_MS = DISTANCIA_M / MOVING_S;
/** 2026-05-25T21:13:24Z en UTC; en Buenos Aires (offset -3 h) son las 18:13:24. */
const INICIO_UTC = '2026-05-25T21:13:24Z';
const INICIO_LOCAL = '2026-05-25T18:13:24Z';
const OFFSET_BA_SEG = -3 * 60 * 60;

function corridaDeStrava(): StravaActivity {
  return {
    id: 18653919721,
    name: 'Carrera vespertina',
    type: 'Run',
    sport_type: 'Run',
    distance: DISTANCIA_M,
    moving_time: MOVING_S,
    elapsed_time: ELAPSED_S,
    total_elevation_gain: DESNIVEL_M,
    start_date: INICIO_UTC,
    start_date_local: INICIO_LOCAL,
    average_speed: VELOCIDAD_MS,
    max_speed: 4.2,
    average_heartrate: 152,
    max_heartrate: 171,
    kudos_count: 0,
    athlete_count: 1,
  };
}

function corridaDeGarmin(): {
  summary: GarminActivitySummary;
  details: GarminActivityDetails;
} {
  const summary: GarminActivitySummary = {
    summaryId: '5001968355',
    activityId: 6287993625,
    activityName: 'Carrera vespertina',
    activityType: 'RUNNING',
    startTimeInSeconds: Math.floor(Date.parse(INICIO_UTC) / 1000),
    startTimeOffsetInSeconds: OFFSET_BA_SEG,
    durationInSeconds: ELAPSED_S,
    distanceInMeters: DISTANCIA_M,
    averageSpeedInMetersPerSecond: VELOCIDAD_MS,
    maxSpeedInMetersPerSecond: 4.2,
    averageHeartRateInBeatsPerMinute: 152,
    maxHeartRateInBeatsPerMinute: 171,
    totalElevationGainInMeters: DESNIVEL_M,
  };
  return { summary, details: { summary, samples: [], laps: [] } };
}

/** Los campos que el dominio lee. `provider`/`externalId`/`id`/`name` son identidad, no datos de la actividad. */
function datosDeporte(a: Activity) {
  return {
    type: a.type,
    sport_type: a.sport_type,
    distance: a.distance,
    moving_time: a.moving_time,
    elapsed_time: a.elapsed_time,
    total_elevation_gain: a.total_elevation_gain,
    start_date: a.start_date,
    start_date_local: a.start_date_local,
    average_speed: a.average_speed,
    max_speed: a.max_speed,
    average_heartrate: a.average_heartrate,
    max_heartrate: a.max_heartrate,
  };
}

describe('la misma corrida desde Strava y desde Garmin', () => {
  it('produce datos deportivos idénticos campo por campo', () => {
    const deStrava = stravaToActivity(corridaDeStrava());
    const { summary, details } = corridaDeGarmin();
    const deGarmin = garminToActivity(summary, details);

    expect(datosDeporte(deGarmin)).toEqual(datosDeporte(deStrava));
  });

  it('conserva la hora local de pared, que es de donde salen el mapa de calor y la distribución horaria', () => {
    const { summary, details } = corridaDeGarmin();
    const deGarmin = garminToActivity(summary, details);

    // El sufijo `Z` miente a propósito: es la hora local disfrazada de UTC.
    // El dominio la lee cortando el string y con `new Date()`, y las dos
    // formas dan las 18 sólo gracias a esa mentira.
    expect(deGarmin.start_date_local).toBe(INICIO_LOCAL);
    expect(deGarmin.start_date_local.slice(11, 13)).toBe('18');
    expect(new Date(deGarmin.start_date_local).getUTCHours()).toBe(18);
    // Y no es lo mismo que la hora real en UTC: si fueran iguales, el offset
    // se perdió por el camino.
    expect(deGarmin.start_date).toBe(INICIO_UTC);
    expect(deGarmin.start_date).not.toBe(deGarmin.start_date_local);
  });

  it('cuenta como corrida para el filtro que usan los ~21 módulos de cálculo', () => {
    const { summary, details } = corridaDeGarmin();

    expect(isRunning(garminToActivity(summary, details))).toBe(true);
    expect(isRunning(stravaToActivity(corridaDeStrava()))).toBe(true);
  });

  it('da las mismas estadísticas procesadas', () => {
    const { summary, details } = corridaDeGarmin();
    const statsStrava = computeStats([stravaToActivity(corridaDeStrava())]);
    const statsGarmin = computeStats([garminToActivity(summary, details)]);

    expect(statsGarmin.totalDistance).toBe(statsStrava.totalDistance);
    expect(statsGarmin.totalTime).toBe(statsStrava.totalTime);
    expect(statsGarmin.totalActivities).toBe(statsStrava.totalActivities);
    expect(statsGarmin.avgPace).toBe(statsStrava.avgPace);
    expect(statsGarmin.hourlyDistribution).toEqual(statsStrava.hourlyDistribution);
    expect(statsGarmin.weekdayDistribution).toEqual(statsStrava.weekdayDistribution);
  });

  it('da las mismas predicciones de carrera', () => {
    const { summary, details } = corridaDeGarmin();

    expect(computeRacePredictions([garminToActivity(summary, details)])).toEqual(
      computeRacePredictions([stravaToActivity(corridaDeStrava())])
    );
  });
});

describe('las dos fuentes conviviendo', () => {
  it('no se pisan aunque el id numérico coincida, porque la identidad es provider + externalId', () => {
    const strava = stravaToActivity({ ...corridaDeStrava(), id: 777 });
    const { summary, details } = corridaDeGarmin();
    const garmin = garminToActivity({ ...summary, activityId: 777 }, details);

    expect(garmin.id).toBe(strava.id);

    const unidas = mergeActivities([strava], [garmin]);

    expect(unidas).toHaveLength(2);
    expect(unidas.map((a) => a.provider).sort()).toEqual(['garmin', 'strava']);
  });

  it('suma el volumen de las dos fuentes igual que si las dos vinieran de Strava', () => {
    const ayer = INICIO_UTC.replace('25T', '24T');
    const strava = stravaToActivity(corridaDeStrava());
    const stravaAyer = stravaToActivity({
      ...corridaDeStrava(),
      id: 2,
      start_date: ayer,
      start_date_local: INICIO_LOCAL.replace('25T', '24T'),
    });
    const { summary, details } = corridaDeGarmin();
    const garminAyer = garminToActivity(
      { ...summary, startTimeInSeconds: summary.startTimeInSeconds - 86400 },
      details
    );

    const mixto = computeStats(mergeActivities([strava], [garminAyer]));
    const soloStrava = computeStats(mergeActivities([strava], [stravaAyer]));

    expect(mixto.totalActivities).toBe(2);
    expect(mixto.totalDistance).toBe(soloStrava.totalDistance);
    expect(mixto.totalTime).toBe(soloStrava.totalTime);
    expect(mixto.avgPace).toBe(soloStrava.avgPace);
  });
});
