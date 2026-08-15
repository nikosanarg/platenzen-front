import { esActividadContenedora, toActivity } from '@/services/providers/garmin/adapter';
import { sportTypeDeGarmin } from '@/services/providers/garmin/sportTypes';
import { decodePolyline } from '@/lib/polylineDecoder';
import { isRunning } from '@/lib/sports';
import type { GarminActivitySummary } from '@/services/providers/garmin/types';

/**
 * El mapper de Garmin. No hay forma de probarlo contra la API real —el
 * programa de desarrolladores de Garmin es sólo para empresas y con
 * aprobación—, así que lo que se fija acá es el contrato con
 * `src/types/activity.ts`: qué sale cuando el dato está, y sobre todo qué sale
 * cuando NO está.
 */

function summary(overrides: Partial<GarminActivitySummary> = {}): GarminActivitySummary {
  return {
    summaryId: 'g-1',
    activityType: 'RUNNING',
    startTimeInSeconds: Math.floor(Date.parse('2026-05-25T21:13:24Z') / 1000),
    startTimeOffsetInSeconds: -3 * 60 * 60,
    durationInSeconds: 2492,
    distanceInMeters: 7001.1,
    ...overrides,
  };
}

describe('identidad de una actividad de Garmin', () => {
  it('usa summaryId como externalId, que es la mitad estable de la identidad', () => {
    expect(toActivity(summary({ summaryId: 'abc-123' })).externalId).toBe('abc-123');
    expect(toActivity(summary()).provider).toBe('garmin');
  });

  it('deja el id numérico en 0 cuando Garmin no manda activityId, en vez de inventar un número', () => {
    expect(toActivity(summary({ activityId: undefined })).id).toBe(0);
    expect(toActivity(summary({ activityId: 6287993625 })).id).toBe(6287993625);
  });
});

describe('un dato que Garmin no mandó no se inventa', () => {
  it('deja el pulso en undefined, nunca en 0', () => {
    const a = toActivity(summary());

    expect(a.average_heartrate).toBeUndefined();
    expect(a.max_heartrate).toBeUndefined();
    // La distinción importa: un 0 entraría a los promedios como un pulso real.
    expect(a.average_heartrate).not.toBe(0);
  });

  it('omite la clave map cuando no hay ninguna coordenada', () => {
    expect(toActivity(summary()).map).toBeUndefined();
    expect('map' in toActivity(summary())).toBe(false);
  });

  it('omite kudos y conteo de atletas, que son métricas sociales que Garmin no tiene', () => {
    const a = toActivity(summary());

    expect(a.kudos_count).toBeUndefined();
    expect(a.athlete_count).toBeUndefined();
  });

  it('deriva la velocidad promedio de distancia y duración cuando Garmin no la manda', () => {
    const a = toActivity(summary({ averageSpeedInMetersPerSecond: undefined }));

    expect(a.average_speed).toBeCloseTo(7001.1 / 2492, 10);
  });

  it('no divide por cero en una actividad de duración cero', () => {
    const a = toActivity(
      summary({ durationInSeconds: 0, averageSpeedInMetersPerSecond: undefined })
    );

    expect(a.average_speed).toBe(0);
  });
});

describe('el GPS de Garmin llega al dominio como polyline', () => {
  it('codifica las muestras de modo que decodePolyline recupere las coordenadas', () => {
    const coords: [number, number][] = [
      [-34.9214, -57.9544],
      [-34.9187, -57.9531],
    ];
    const a = toActivity(summary(), {
      summary: summary(),
      samples: coords.map(([lat, lon]) => ({
        latitudeInDegree: lat,
        longitudeInDegree: lon,
      })),
    });

    expect(a.map?.summary_polyline).toBeDefined();
    expect(decodePolyline(a.map!.summary_polyline!)).toEqual(coords);
  });

  it('descarta una muestra que tiene latitud pero no longitud', () => {
    const a = toActivity(summary(), {
      summary: summary(),
      samples: [
        { latitudeInDegree: -34.92, longitudeInDegree: -57.95 },
        { latitudeInDegree: -34.91 },
        { heartRate: 150 },
      ],
    });

    expect(decodePolyline(a.map!.summary_polyline!)).toHaveLength(1);
  });
});

describe('tiempo en movimiento', () => {
  it('toma el último movingDurationInSeconds de las muestras cuando están', () => {
    const a = toActivity(summary(), {
      summary: summary(),
      samples: [{ movingDurationInSeconds: 100 }, { movingDurationInSeconds: 2400 }],
    });

    expect(a.moving_time).toBe(2400);
    expect(a.elapsed_time).toBe(2492);
  });

  it('cae a la duración total cuando no hay muestras, que es lo único que el summary sabe', () => {
    const a = toActivity(summary());

    expect(a.moving_time).toBe(2492);
    expect(a.moving_time).toBe(a.elapsed_time);
  });
});

describe('tipos de actividad', () => {
  it('traduce los tres orígenes de carrera bajo techo al mismo VirtualRun', () => {
    expect(sportTypeDeGarmin('TREADMILL_RUNNING')).toBe('VirtualRun');
    expect(sportTypeDeGarmin('INDOOR_RUNNING')).toBe('VirtualRun');
    expect(sportTypeDeGarmin('VIRTUAL_RUNNING')).toBe('VirtualRun');
  });

  it('manda ultra y trail a TrailRun, que no es obvio por el nombre', () => {
    expect(sportTypeDeGarmin('TRAIL_RUNNING')).toBe('TrailRun');
    expect(sportTypeDeGarmin('ULTRA_RUNNING')).toBe('TrailRun');
  });

  it('deja un tipo desconocido tal cual, sin forzarlo a Run', () => {
    expect(sportTypeDeGarmin('STAND_UP_PADDLEBOARDING')).toBe('STAND_UP_PADDLEBOARDING');
    // Lo que importa del caso: no ensucia los cálculos de carrera.
    expect(isRunning(toActivity(summary({ activityType: 'STAND_UP_PADDLEBOARDING' })))).toBe(
      false
    );
  });

  it('usa Workout sólo cuando ni siquiera vino el tipo, que no es lo mismo que un tipo desconocido', () => {
    expect(sportTypeDeGarmin(undefined)).toBe('Workout');
  });

  it('no cuenta como corrida una sesión de yoga', () => {
    expect(isRunning(toActivity(summary({ activityType: 'YOGA' })))).toBe(false);
  });
});

describe('nombre de la actividad', () => {
  it('usa el de Garmin cuando viene', () => {
    expect(toActivity(summary({ activityName: 'Fondo del domingo' })).name).toBe(
      'Fondo del domingo'
    );
  });

  it('deriva una etiqueta legible cuando falta, en vez de dejarlo vacío', () => {
    expect(toActivity(summary({ activityName: undefined })).name).toBe('Carrera');
    expect(toActivity(summary({ activityName: '   ' })).name).toBe('Carrera');
  });
});

describe('actividades multideporte', () => {
  it('reconoce el contenedor, cuyos hijos llegan por separado y duplicarían la distancia', () => {
    expect(esActividadContenedora(summary({ isParent: true }))).toBe(true);
  });

  it('no marca como contenedor a una actividad común', () => {
    expect(esActividadContenedora(summary())).toBe(false);
    expect(esActividadContenedora(summary({ isParent: false }))).toBe(false);
  });
});
