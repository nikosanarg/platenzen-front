/**
 * Comparador de períodos. El riesgo está en los bordes de las ventanas: si un
 * período se solapa con el anterior, la misma salida cuenta dos veces y la
 * variación porcentual queda inflada.
 */
import {
  computePeriodComparisons,
  formatPaceSec,
  formatTimeSec,
  pctChange,
} from '@/lib/periodComparison';
import { activity } from '@/__tests__/helpers/activity';
import { StravaActivity } from '@/types/strava';

const on = (date: string, over: Partial<StravaActivity> = {}) =>
  activity({ start_date_local: `${date}T12:00:00Z`, start_date: `${date}T12:00:00Z`, ...over });

const periodo = (acts: StravaActivity[], key: '30d' | '90d' | 'year') =>
  computePeriodComparisons(acts).find((p) => p.period === key)!;

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-07-15T12:00:00Z'));
});

afterEach(() => {
  jest.useRealTimers();
});

describe('computePeriodComparisons: estructura', () => {
  it('devuelve los tres períodos con sus etiquetas', () => {
    const periodos = computePeriodComparisons([]);

    expect(periodos.map((p) => p.period)).toEqual(['30d', '90d', 'year']);
    expect(periodos[0].label).toBe('Últimos 30 días');
    expect(periodos[2].label).toBe('Año 2026');
  });

  it('sin actividades devuelve todo en cero, no NaN', () => {
    const p = periodo([], '30d');

    expect(p.current.distanceKm).toBe(0);
    expect(p.current.activities).toBe(0);
    expect(p.current.avgPaceSec).toBe(0);
    expect(p.current.avgTimePerActivitySec).toBe(0);
  });
});

describe('ventanas de tiempo', () => {
  it('ubica en el período actual lo de los últimos 30 días', () => {
    const p = periodo([on('2026-07-10', { distance: 10000, moving_time: 3000 })], '30d');

    expect(p.current.activities).toBe(1);
    expect(p.previous.activities).toBe(0);
  });

  it('ubica en el período anterior lo de 30 a 60 días atrás', () => {
    const p = periodo([on('2026-06-05', { distance: 10000, moving_time: 3000 })], '30d');

    expect(p.current.activities).toBe(0);
    expect(p.previous.activities).toBe(1);
  });

  it('no cuenta dos veces la misma salida entre actual y anterior', () => {
    const acts = [
      on('2026-07-10', { id: 1, distance: 10000, moving_time: 3000 }),
      on('2026-06-05', { id: 2, distance: 10000, moving_time: 3000 }),
    ];
    const p = periodo(acts, '30d');

    expect(p.current.activities + p.previous.activities).toBe(2);
  });

  it('deja afuera lo más viejo que la ventana anterior', () => {
    const p = periodo([on('2026-01-01', { distance: 10000, moving_time: 3000 })], '30d');

    expect(p.current.activities).toBe(0);
    expect(p.previous.activities).toBe(0);
  });

  it('el año actual arranca el 1 de enero y el anterior es el año completo', () => {
    const acts = [
      on('2026-02-01', { id: 1, distance: 10000, moving_time: 3000 }),
      on('2025-06-01', { id: 2, distance: 10000, moving_time: 3000 }),
      on('2025-12-31', { id: 3, distance: 10000, moving_time: 3000 }),
    ];
    const p = periodo(acts, 'year');

    expect(p.current.activities).toBe(1);
    expect(p.previous.activities).toBe(2);
  });
});

describe('métricas del período', () => {
  it('suma km redondeando a un decimal y acumula el tiempo', () => {
    const p = periodo(
      [
        on('2026-07-10', { id: 1, distance: 5250, moving_time: 1500 }),
        on('2026-07-11', { id: 2, distance: 10000, moving_time: 3000 }),
      ],
      '30d',
    );

    expect(p.current.distanceKm).toBe(15.3);
    expect(p.current.totalTimeSec).toBe(4500);
    expect(p.current.avgTimePerActivitySec).toBe(2250);
  });

  it('promedia el ritmo sólo sobre las actividades de running', () => {
    const p = periodo(
      [
        on('2026-07-10', { id: 1, distance: 10000, moving_time: 3000 }),
        on('2026-07-11', { id: 2, sport_type: 'Ride', type: 'Ride', distance: 30000, moving_time: 3000 }),
      ],
      '30d',
    );

    expect(p.current.avgPaceSec).toBe(300);
    // La distancia total sí incluye la bici.
    expect(p.current.distanceKm).toBe(40);
  });
});

describe('pctChange', () => {
  it('calcula la variación porcentual redondeada', () => {
    expect(pctChange(150, 100)).toBe(50);
    expect(pctChange(50, 100)).toBe(-50);
    expect(pctChange(100, 100)).toBe(0);
  });

  it('devuelve null si el período anterior fue cero, en lugar de infinito', () => {
    expect(pctChange(100, 0)).toBeNull();
  });
});

describe('formatPaceSec', () => {
  it('formatea minutos y segundos por km', () => {
    expect(formatPaceSec(300)).toBe('5:00/km');
    expect(formatPaceSec(305)).toBe('5:05/km');
  });

  it('muestra guión cuando no hay ritmo', () => {
    expect(formatPaceSec(0)).toBe('—');
  });
});

describe('formatTimeSec', () => {
  it('omite las horas por debajo de la hora', () => {
    expect(formatTimeSec(1800)).toBe('30m');
  });

  it('muestra horas y minutos cuando corresponde', () => {
    expect(formatTimeSec(5400)).toBe('1h 30m');
  });

  it('muestra guión cuando no hay tiempo', () => {
    expect(formatTimeSec(0)).toBe('—');
  });
});
