/**
 * Predicciones de carrera. La tabla muestra dos números distintos por distancia
 * y conviene no confundirlos: `bestSeconds` es una proyección lineal de una
 * salida real que ya alcanzó (casi) la distancia, y `predictedSeconds` es la
 * fórmula de Riegel (T2 = T1 × (D2/D1)^1.06) anclada en la salida más rápida.
 *
 * Riegel castiga las distancias más largas: predecir maratón desde un 5K tiene
 * que dar peor ritmo que el del 5K, nunca igual ni mejor.
 */
import {
  RACE_DISTANCES,
  computeRacePredictions,
  formatRaceDate,
  formatRaceTime,
} from '@/lib/racePredictor';
import { HALF_MARATHON_KM, MARATHON_KM } from '@/lib/distances';
import { activity } from '@/__tests__/helpers/activity';
import { StravaActivity } from '@/types/strava';

const on = (date: string, over: Partial<StravaActivity> = {}) =>
  activity({ start_date_local: `${date}T12:00:00Z`, start_date: `${date}T12:00:00Z`, ...over });

const rowFor = (acts: StravaActivity[], km: number) =>
  computeRacePredictions(acts).find((r) => r.distanceKm === km)!;

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-07-15T12:00:00Z'));
});

afterEach(() => {
  jest.useRealTimers();
});

describe('RACE_DISTANCES', () => {
  it('cubre las seis distancias de la tabla, en orden creciente', () => {
    const kms = RACE_DISTANCES.map((d) => d.km);
    expect(kms).toEqual([5, 10, 15, HALF_MARATHON_KM, 31.5, MARATHON_KM]);
  });

  it('etiqueta media y maratón con la distancia exacta y coma decimal', () => {
    expect(RACE_DISTANCES[3].label).toBe('21,0975 km');
    expect(RACE_DISTANCES[5].label).toBe('42,195 km');
  });
});

describe('computeRacePredictions sin datos', () => {
  it('devuelve una fila por distancia, todas vacías', () => {
    const rows = computeRacePredictions([]);

    expect(rows).toHaveLength(RACE_DISTANCES.length);
    expect(rows.every((r) => r.bestSeconds === null)).toBe(true);
    expect(rows.every((r) => r.predictedSeconds === null)).toBe(true);
    expect(rows.every((r) => r.bestDate === null)).toBe(true);
  });

  it('ignora las salidas de hace más de 12 meses', () => {
    const rows = computeRacePredictions([on('2024-01-01', { distance: 10000, moving_time: 3000 })]);
    expect(rows.every((r) => r.bestSeconds === null)).toBe(true);
  });

  it('ignora lo que no es running', () => {
    const rows = computeRacePredictions([
      on('2026-07-01', { sport_type: 'Ride', type: 'Ride', distance: 40000, moving_time: 3600 }),
    ]);
    expect(rows.every((r) => r.bestSeconds === null)).toBe(true);
  });

  it('cae a `type` cuando la actividad no trae `sport_type`', () => {
    // Strava no siempre manda sport_type en actividades viejas.
    const rows = computeRacePredictions([
      on('2026-07-01', { sport_type: '', type: 'Run', distance: 10000, moving_time: 3000 }),
    ]);

    expect(rows.find((r) => r.distanceKm === 10)!.bestSeconds).toBe(3000);
  });

  it('descarta las salidas sin tiempo o sin distancia', () => {
    expect(
      computeRacePredictions([on('2026-07-01', { distance: 10000, moving_time: 0 })])
        .every((r) => r.bestSeconds === null),
    ).toBe(true);

    expect(
      computeRacePredictions([on('2026-07-01', { distance: 0, moving_time: 3000 })])
        .every((r) => r.bestSeconds === null),
    ).toBe(true);
  });
});

describe('bestSeconds: proyección lineal', () => {
  it('proyecta linealmente a la distancia objetivo', () => {
    // 10 km en 3000 s → 5 km en 1500 s.
    const row = rowFor([on('2026-07-01', { distance: 10000, moving_time: 3000 })], 5);

    expect(row.bestSeconds).toBe(1500);
    expect(row.bestDate).toBe('2026-07-01');
  });

  it('exige un mínimo de distancia: no proyecta maratón desde un 10K', () => {
    const acts = [on('2026-07-01', { distance: 10000, moving_time: 3000 })];

    expect(rowFor(acts, 10).bestSeconds).not.toBeNull();
    expect(rowFor(acts, MARATHON_KM).bestSeconds).toBeNull();
  });

  it('acepta quedarse algo corto del objetivo: 8.5 km sirven para el 10K', () => {
    const acts = [on('2026-07-01', { distance: 8600, moving_time: 2580 })];
    expect(rowFor(acts, 10).bestSeconds).not.toBeNull();
  });

  it('se queda con la mejor proyección y su fecha', () => {
    const row = rowFor(
      [
        on('2026-06-01', { id: 1, distance: 10000, moving_time: 3600 }),
        on('2026-07-01', { id: 2, distance: 10000, moving_time: 3000 }),
      ],
      10,
    );

    expect(row.bestSeconds).toBe(3000);
    expect(row.bestDate).toBe('2026-07-01');
  });
});

describe('predictedSeconds: Riegel', () => {
  it('devuelve el tiempo de referencia en su propia distancia', () => {
    // Referencia: 5 km en 1500 s. Predicción a 5 km = el mismo tiempo.
    const row = rowFor([on('2026-07-01', { distance: 5000, moving_time: 1500 })], 5);
    expect(row.predictedSeconds).toBe(1500);
  });

  it('penaliza las distancias largas: el ritmo empeora al extrapolar', () => {
    const acts = [on('2026-07-01', { distance: 5000, moving_time: 1500 })];
    const cinco = rowFor(acts, 5);
    const maraton = rowFor(acts, MARATHON_KM);

    const ritmo5k = cinco.predictedSeconds! / 5;
    const ritmoMaraton = maraton.predictedSeconds! / MARATHON_KM;

    expect(ritmoMaraton).toBeGreaterThan(ritmo5k);
  });

  it('aplica el exponente 1.06, no una regla de tres', () => {
    const acts = [on('2026-07-01', { distance: 5000, moving_time: 1500 })];
    const lineal = 1500 * (10 / 5);
    const riegel = rowFor(acts, 10).predictedSeconds!;

    expect(riegel).toBeGreaterThan(lineal);
    expect(riegel).toBe(Math.round(1500 * Math.pow(10 / 5, 1.06)));
  });

  it('crece de forma monótona con la distancia', () => {
    const rows = computeRacePredictions([on('2026-07-01', { distance: 10000, moving_time: 3000 })]);
    const predichos = rows.map((r) => r.predictedSeconds!);

    expect(predichos).toEqual([...predichos].sort((a, b) => a - b));
  });

  it('necesita al menos una salida de 5 km para anclar', () => {
    const rows = computeRacePredictions([on('2026-07-01', { distance: 4000, moving_time: 1200 })]);
    expect(rows.every((r) => r.predictedSeconds === null)).toBe(true);
  });
});

describe('formatRaceTime', () => {
  it('omite las horas por debajo de la hora', () => {
    expect(formatRaceTime(1500)).toBe('25:00');
    expect(formatRaceTime(305)).toBe('5:05');
  });

  it('incluye horas con minutos y segundos en dos dígitos', () => {
    expect(formatRaceTime(3661)).toBe('1:01:01');
    expect(formatRaceTime(14400)).toBe('4:00:00');
  });

  it('redondea los segundos fraccionarios', () => {
    expect(formatRaceTime(1499.6)).toBe('25:00');
  });
});

describe('formatRaceDate', () => {
  it('formatea con mes abreviado en castellano', () => {
    expect(formatRaceDate('2026-07-15')).toBe('15 jul 2026');
    expect(formatRaceDate('2026-01-01')).toBe('1 ene 2026');
  });
});
