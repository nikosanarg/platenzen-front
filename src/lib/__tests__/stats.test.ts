/**
 * `computeStats` es la entrada única de datos del dashboard: todo lo que el
 * corredor ve arranca acá. Se verifican los agregados y los tres filtros que
 * más fácil se rompen: qué cuenta como running, qué entra en el año actual y
 * cómo se leen las horas locales.
 */
import { computeStats } from '@/lib/stats';
import { activity } from '@/__tests__/helpers/activity';

const on = (date: string, over: Parameters<typeof activity>[0] = {}) =>
  activity({ start_date_local: `${date}T12:00:00Z`, ...over });

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-07-15T12:00:00Z'));
});

afterEach(() => {
  jest.useRealTimers();
});

describe('computeStats sin actividades', () => {
  const stats = computeStats([]);

  it('devuelve todo en cero en lugar de NaN', () => {
    expect(stats.totalDistance).toBe(0);
    expect(stats.totalTime).toBe(0);
    expect(stats.totalActivities).toBe(0);
    expect(stats.avgPace).toBe(0);
    expect(stats.bestPace).toBe(0);
    expect(stats.longestActivity).toBe(0);
    expect(stats.weeklyAvgDistance).toBe(0);
  });

  it('devuelve las series como listas vacías', () => {
    expect(stats.monthly).toEqual([]);
    expect(stats.weekly).toEqual([]);
    expect(stats.daily).toEqual([]);
    expect(stats.paceEvolution).toEqual([]);
    expect(stats.sportDistribution).toEqual([]);
  });

  it('igual devuelve las 24 horas y los 7 días, en cero', () => {
    expect(stats.hourlyDistribution).toHaveLength(24);
    expect(stats.weekdayDistribution).toHaveLength(7);
    expect(stats.hourlyDistribution.every((h) => h.count === 0)).toBe(true);
  });
});

describe('computeStats: agregados', () => {
  it('suma distancia en km y tiempo en segundos, redondeando a un decimal', () => {
    const stats = computeStats([
      on('2026-07-01', { id: 1, distance: 5250, moving_time: 1500 }),
      on('2026-07-02', { id: 2, distance: 10000, moving_time: 3000 }),
    ]);

    expect(stats.totalDistance).toBe(15.3);
    expect(stats.totalTime).toBe(4500);
    expect(stats.totalActivities).toBe(2);
  });

  it('toma la salida más larga en km', () => {
    const stats = computeStats([
      on('2026-07-01', { id: 1, distance: 5000 }),
      on('2026-07-02', { id: 2, distance: 21097.5 }),
    ]);

    expect(stats.longestActivity).toBe(21.1);
  });

  it('el mejor ritmo es el más bajo en segundos por km', () => {
    const stats = computeStats([
      on('2026-07-01', { id: 1, distance: 10000, moving_time: 3000 }), // 300 s/km
      on('2026-07-02', { id: 2, distance: 10000, moving_time: 2400 }), // 240 s/km
    ]);

    expect(stats.bestPace).toBe(240);
    expect(stats.avgPace).toBe(270);
  });
});

describe('computeStats: qué cuenta como running', () => {
  it('excluye del ritmo las actividades que no son de running', () => {
    const stats = computeStats([
      on('2026-07-01', { id: 1, distance: 10000, moving_time: 3000 }),
      on('2026-07-02', { id: 2, sport_type: 'Ride', type: 'Ride', distance: 30000, moving_time: 3000 }),
    ]);

    // Sólo la corrida entra en el promedio de ritmo.
    expect(stats.avgPace).toBe(300);
    // Pero la distancia total suma todo.
    expect(stats.totalDistance).toBe(40);
  });

  it('incluye trail y cinta en el ritmo', () => {
    const stats = computeStats([
      on('2026-07-01', { id: 1, sport_type: 'TrailRun', type: 'TrailRun', distance: 10000, moving_time: 3000 }),
      on('2026-07-02', { id: 2, sport_type: 'VirtualRun', type: 'VirtualRun', distance: 10000, moving_time: 3000 }),
    ]);

    expect(stats.avgPace).toBe(300);
  });

  it('la evolución de ritmo descarta las salidas de 1 km o menos', () => {
    const stats = computeStats([
      on('2026-07-01', { id: 1, distance: 900, moving_time: 300 }),
      on('2026-07-02', { id: 2, distance: 5000, moving_time: 1500 }),
    ]);

    expect(stats.paceEvolution).toHaveLength(1);
    expect(stats.paceEvolution[0].date).toBe('2026-07-02');
  });
});

describe('computeStats: año actual', () => {
  it('cuenta sólo lo del año en curso', () => {
    const stats = computeStats([
      on('2025-12-31', { id: 1, distance: 10000 }),
      on('2026-01-01', { id: 2, distance: 5000 }),
      on('2026-07-01', { id: 3, distance: 5000 }),
    ]);

    expect(stats.currentYearActivities).toBe(2);
    expect(stats.currentYearDistance).toBe(10);
  });
});

describe('computeStats: distribuciones', () => {
  it('lee la hora del string local, sin convertir husos', () => {
    const stats = computeStats([activity({ start_date_local: '2026-07-01T06:30:00Z' })]);

    expect(stats.hourlyDistribution[6].count).toBe(1);
    expect(stats.hourlyDistribution[6].label).toBe('06:00');
  });

  it('ordena los días de lunes a domingo, con el fin de semana al final', () => {
    const stats = computeStats([]);
    expect(stats.weekdayDistribution.map((d) => d.label)).toEqual([
      'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom',
    ]);
  });

  it('ubica cada salida en su día de la semana', () => {
    // 2026-07-15 es miércoles.
    const stats = computeStats([on('2026-07-15')]);
    const miercoles = stats.weekdayDistribution.find((d) => d.label === 'Mié');

    expect(miercoles?.count).toBe(1);
  });

  it('ordena los deportes por cantidad descendente', () => {
    const stats = computeStats([
      on('2026-07-01', { id: 1, sport_type: 'Ride', type: 'Ride' }),
      on('2026-07-02', { id: 2 }),
      on('2026-07-03', { id: 3 }),
    ]);

    expect(stats.sportDistribution[0].sport).toBe('Run');
    expect(stats.sportDistribution[0].count).toBe(2);
  });

  it('acumula la distancia en orden cronológico, no de entrada', () => {
    const stats = computeStats([
      on('2026-07-03', { id: 1, distance: 3000 }),
      on('2026-07-01', { id: 2, distance: 5000 }),
    ]);

    expect(stats.cumulativeDistance.map((p) => p.cumulative)).toEqual([5, 8]);
  });
});
