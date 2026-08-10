/**
 * Nivel y XP. Es la métrica más central del producto y la que el corredor mira
 * primero, así que se fijan acá las tarifas de cada fuente de XP y la escala de
 * niveles: si una tarifa cambia sin querer, todo el progreso pasado se recalcula
 * distinto y el nivel del usuario se mueve sin que él haya hecho nada.
 *
 * Las tarifas verificadas son: 5 XP por km (12 meses), 10 por hito de distancia,
 * 10 por récord personal, 20 por semana récord, 30 por semana de 3+ salidas y
 * 50 por mes completamente activo.
 */
import { LEVEL_NAMES, LEVEL_THRESHOLDS, computeXPBreakdown, getLevelInfo } from '@/lib/xpSystem';
import { computeStats } from '@/lib/stats';
import { activity } from '@/__tests__/helpers/activity';
import { StravaActivity } from '@/types/strava';

const on = (date: string, over: Partial<StravaActivity> = {}) =>
  activity({ start_date_local: `${date}T12:00:00Z`, start_date: `${date}T12:00:00Z`, ...over });

/** Corre el breakdown con las stats reales derivadas de las mismas actividades. */
const breakdownOf = (acts: StravaActivity[]) => computeXPBreakdown(acts, computeStats(acts));

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-07-15T12:00:00Z'));
});

afterEach(() => {
  jest.useRealTimers();
});

describe('LEVEL_THRESHOLDS', () => {
  it('arranca en 0 y es estrictamente creciente', () => {
    expect(LEVEL_THRESHOLDS[0]).toBe(0);
    for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
      expect(LEVEL_THRESHOLDS[i]).toBeGreaterThan(LEVEL_THRESHOLDS[i - 1]);
    }
  });

  it('sigue la serie de Fibonacci escalada por 200 XP', () => {
    // fib 1,1,2,3,5,8… acumulado y por 200.
    expect(LEVEL_THRESHOLDS.slice(0, 7)).toEqual([0, 200, 400, 800, 1400, 2400, 4000]);
  });

  it('tiene un umbral por nombre de nivel, más el 0 inicial', () => {
    expect(LEVEL_THRESHOLDS).toHaveLength(LEVEL_NAMES.length + 1);
  });
});

describe('computeXPBreakdown sin actividades', () => {
  const breakdown = breakdownOf([]);

  it('no otorga XP', () => {
    expect(breakdown.total).toBe(0);
    expect(breakdown.fromKm).toBe(0);
    expect(breakdown.fromAchievements).toBe(0);
  });

  it('invita a empezar en lugar de mostrar una fuente vacía', () => {
    expect(breakdown.xpSourceSummary).toBe('Empezá a correr para ganar XP.');
    expect(breakdown.xpEvents).toEqual([]);
  });
});

describe('computeXPBreakdown: tarifas', () => {
  it('paga 5 XP por km de los últimos 12 meses', () => {
    const breakdown = breakdownOf([on('2026-07-01', { distance: 10000, moving_time: 3000 })]);

    expect(breakdown.totalKm12mo).toBeCloseTo(10, 6);
    expect(breakdown.fromKm).toBe(50);
  });

  it('ignora los km de más de 12 meses atrás', () => {
    const breakdown = breakdownOf([on('2024-01-01', { distance: 10000, moving_time: 3000 })]);

    expect(breakdown.totalKm12mo).toBe(0);
    expect(breakdown.fromKm).toBe(0);
  });

  it('ignora los km de deportes que no son running', () => {
    const breakdown = breakdownOf([
      on('2026-07-01', { sport_type: 'Ride', type: 'Ride', distance: 40000, moving_time: 3600 }),
    ]);

    expect(breakdown.fromKm).toBe(0);
  });

  it('cuenta como running una actividad con sport_type vacío, usando el type como respaldo', () => {
    const breakdown = breakdownOf([
      on('2026-07-01', { sport_type: '', type: 'Run', distance: 10000, moving_time: 3000 }),
    ]);

    expect(breakdown.fromKm).toBe(50);
  });

  it('paga 50 XP por mes con las 4 o más semanas completas', () => {
    const meses = ['02', '09', '16', '23'];
    const acts = meses.flatMap((dia, semana) => [
      on(`2026-03-${dia}`, { id: semana * 3 + 1, distance: 5000, moving_time: 1500 }),
      on(`2026-03-${String(Number(dia) + 1).padStart(2, '0')}`, { id: semana * 3 + 2, distance: 5000, moving_time: 1500 }),
      on(`2026-03-${String(Number(dia) + 2).padStart(2, '0')}`, { id: semana * 3 + 3, distance: 5000, moving_time: 1500 }),
    ]);
    const breakdown = breakdownOf(acts);

    expect(breakdown.completeMonths).toBe(1);
    expect(breakdown.fromCompleteMonths).toBe(50);
  });

  it('paga 10 XP por hito de distancia, contando cada hito una sola vez', () => {
    const dos = breakdownOf([
      on('2026-07-01', { id: 1, distance: 10500, moving_time: 3000 }),
      on('2026-07-02', { id: 2, distance: 10600, moving_time: 3000 }),
    ]);

    // 10.5 km y 10.6 km cruzan los hitos de 5 y 10 km: dos hitos, no cuatro.
    expect(dos.milestonesReached).toBe(2);
    expect(dos.fromMilestones).toBe(20);
  });

  it('paga 30 XP por semana con 3 salidas o más', () => {
    const breakdown = breakdownOf([
      on('2026-07-13', { id: 1, distance: 5000, moving_time: 1500 }),
      on('2026-07-14', { id: 2, distance: 5000, moving_time: 1500 }),
      on('2026-07-15', { id: 3, distance: 5000, moving_time: 1500 }),
    ]);

    expect(breakdown.completeWeeks).toBe(1);
    expect(breakdown.fromCompleteWeeks).toBe(30);
  });

  it('no paga la semana con menos de 3 salidas', () => {
    const breakdown = breakdownOf([
      on('2026-07-13', { id: 1, distance: 5000, moving_time: 1500 }),
      on('2026-07-14', { id: 2, distance: 5000, moving_time: 1500 }),
    ]);

    expect(breakdown.completeWeeks).toBe(0);
    expect(breakdown.fromCompleteWeeks).toBe(0);
  });

  it('paga 20 XP por cada semana que supera el récord de volumen anterior', () => {
    const breakdown = breakdownOf([
      on('2026-06-29', { id: 1, distance: 5000, moving_time: 1500 }),
      on('2026-07-06', { id: 2, distance: 10000, moving_time: 3000 }),
      on('2026-07-13', { id: 3, distance: 15000, moving_time: 4500 }),
    ]);

    // Cada semana supera a la anterior: tres récords.
    expect(breakdown.weeklyRecordCount).toBe(3);
    expect(breakdown.fromWeeklyRecords).toBe(60);
  });

  it('no cuenta como récord la semana que no supera el máximo', () => {
    const breakdown = breakdownOf([
      on('2026-07-06', { id: 1, distance: 15000, moving_time: 4500 }),
      on('2026-07-13', { id: 2, distance: 5000, moving_time: 1500 }),
    ]);

    expect(breakdown.weeklyRecordCount).toBe(1);
  });

  it('el total es la suma de todas las fuentes', () => {
    const breakdown = breakdownOf([
      on('2026-07-13', { id: 1, distance: 10000, moving_time: 3000 }),
      on('2026-07-14', { id: 2, distance: 10000, moving_time: 2900 }),
      on('2026-07-15', { id: 3, distance: 12000, moving_time: 3600 }),
    ]);

    const suma =
      breakdown.fromKm +
      breakdown.fromMilestones +
      breakdown.fromPRs +
      breakdown.fromWeeklyRecords +
      breakdown.fromCompleteWeeks +
      breakdown.fromCompleteMonths +
      breakdown.fromAchievements;

    expect(breakdown.total).toBe(suma);
  });
});

describe('computeXPBreakdown: récords personales', () => {
  it('cuenta la primera salida válida como récord de distancia', () => {
    const breakdown = breakdownOf([on('2026-07-01', { distance: 5000, moving_time: 1500 })]);
    expect(breakdown.prCount).toBeGreaterThan(0);
  });

  it('no cuenta récords en salidas de menos de 1 km', () => {
    const breakdown = breakdownOf([on('2026-07-01', { distance: 900, moving_time: 300 })]);
    expect(breakdown.prCount).toBe(0);
  });

  it('no vuelve a contar récord si la salida no mejora nada', () => {
    const breakdown = breakdownOf([
      on('2026-07-01', { id: 1, distance: 10000, moving_time: 3000 }),
      on('2026-07-02', { id: 2, distance: 8000, moving_time: 2600 }),
    ]);

    // La segunda es más corta y más lenta: no agrega récord.
    const soloLaPrimera = breakdownOf([on('2026-07-01', { id: 1, distance: 10000, moving_time: 3000 })]);
    expect(breakdown.prCount).toBe(soloLaPrimera.prCount);
  });
});

describe('computeXPBreakdown: resumen y eventos', () => {
  it('nombra la mayor fuente de XP', () => {
    const breakdown = breakdownOf([on('2026-07-01', { distance: 30000, moving_time: 9000 })]);

    expect(breakdown.xpSourceSummary).toContain('Tu mayor fuente de XP');
    expect(breakdown.xpSourceSummary).toContain('km recorridos');
  });

  it('lista como máximo 5 eventos, ordenados de mayor a menor XP', () => {
    const breakdown = breakdownOf([
      on('2026-07-13', { id: 1, distance: 21100, moving_time: 7000 }),
      on('2026-07-14', { id: 2, distance: 10000, moving_time: 2900 }),
      on('2026-07-15', { id: 3, distance: 42200, moving_time: 14000 }),
    ]);

    expect(breakdown.xpEvents.length).toBeLessThanOrEqual(5);
    const xps = breakdown.xpEvents.map((e) => e.xp);
    expect(xps).toEqual([...xps].sort((a, b) => b - a));
  });

  it('no lista fuentes que aportaron 0 XP', () => {
    const breakdown = breakdownOf([on('2026-07-01', { distance: 10000, moving_time: 3000 })]);
    expect(breakdown.xpEvents.every((e) => e.xp > 0)).toBe(true);
  });
});

describe('getLevelInfo', () => {
  it('arranca en nivel 1 sin actividades', () => {
    const info = getLevelInfo([], computeStats([]));

    expect(info.level).toBe(1);
    expect(info.name).toBe(LEVEL_NAMES[0]);
    expect(info.xp).toBe(0);
    expect(info.currentThreshold).toBe(0);
  });

  it('el progreso queda entre 0 y 1', () => {
    const acts = [on('2026-07-01', { distance: 30000, moving_time: 9000 })];
    const info = getLevelInfo(acts, computeStats(acts));

    expect(info.progress).toBeGreaterThanOrEqual(0);
    expect(info.progress).toBeLessThanOrEqual(1);
  });

  it('el nivel es coherente con el umbral alcanzado', () => {
    const acts = [
      on('2026-07-13', { id: 1, distance: 21100, moving_time: 7000 }),
      on('2026-07-14', { id: 2, distance: 15000, moving_time: 4500 }),
      on('2026-07-15', { id: 3, distance: 10000, moving_time: 2900 }),
    ];
    const info = getLevelInfo(acts, computeStats(acts));

    expect(info.xp).toBeGreaterThanOrEqual(info.currentThreshold);
    if (info.nextThreshold !== null) {
      expect(info.xp).toBeLessThan(info.nextThreshold);
      expect(info.xpToNext).toBe(info.nextThreshold - info.xp);
    }
    expect(info.name).toBe(LEVEL_NAMES[info.level - 1]);
  });

  it('nunca pasa del último nivel definido', () => {
    const acts = Array.from({ length: 40 }, (_, i) =>
      on('2026-07-01', { id: i + 1, distance: 42200, moving_time: 12000 }),
    );
    const info = getLevelInfo(acts, computeStats(acts));

    expect(info.level).toBeLessThanOrEqual(LEVEL_NAMES.length);
    expect(info.name).toBeDefined();
  });
});
