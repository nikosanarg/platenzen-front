/**
 * Observaciones automáticas. Son frases que el corredor lee como si alguien
 * hubiera mirado sus datos, así que lo que importa es que cada una aparezca sólo
 * cuando su condición se cumple: una observación de crecimiento con datos planos
 * es una mentira, y una lista vacía es preferible a una inventada.
 *
 * Devuelve como máximo 5.
 */
import { generateSmartInsights } from '@/utils/insights';
import { computeStats } from '@/lib/stats';
import { MonthlyStats, PacePoint, ProcessedStats, WeeklyStats } from '@/types/stats';

const NOW = new Date('2026-07-15T12:00:00Z');

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});

afterEach(() => {
  jest.useRealTimers();
});

const months = (...pairs: Array<[string, number]>): MonthlyStats[] =>
  pairs.map(([month, distance]) => ({ month, label: month, distance, count: 4, time: 3600 }));

const weeks = (count: number, active = true): WeeklyStats[] =>
  Array.from({ length: count }, (_, i) => ({
    week: `2026-W${String(i + 1).padStart(2, '0')}`,
    label: '',
    distance: active ? 20 : 0,
    count: active ? 3 : 0,
  }));

const paces = (...values: number[]): PacePoint[] =>
  values.map((pace, i) => ({ date: `2026-01-${String(i + 1).padStart(2, '0')}`, pace, label: '' }));

const statsWith = (over: Partial<ProcessedStats> = {}): ProcessedStats => ({
  ...computeStats([]),
  ...over,
});

const ids = (stats: ProcessedStats) => generateSmartInsights([], stats).map((i) => i.id);

const textOf = (stats: ProcessedStats, id: string) =>
  generateSmartInsights([], stats).find((i) => i.id === id)?.text;

describe('generateSmartInsights: contrato', () => {
  it('sin datos no inventa observaciones', () => {
    expect(generateSmartInsights([], statsWith())).toEqual([]);
  });

  it('nunca devuelve más de 5', () => {
    const stats = statsWith({
      weekdayDistribution: [{ day: 2, label: 'Mar', count: 20 }],
      monthly: months(
        ['2026-01', 10], ['2026-02', 10], ['2026-03', 10],
        ['2026-04', 40], ['2026-05', 40], ['2026-06', 40], ['2026-07', 50],
      ),
      weekly: weeks(32),
      paceEvolution: paces(400, 400, 400, 400, 400, 300, 300, 300, 300, 300),
      longestActivity: 25,
    });

    expect(generateSmartInsights([], stats).length).toBeLessThanOrEqual(5);
  });

  it('cada observación trae id y texto', () => {
    const stats = statsWith({ longestActivity: 25 });

    for (const insight of generateSmartInsights([], stats)) {
      expect(insight.id.length).toBeGreaterThan(0);
      expect(insight.text.length).toBeGreaterThan(0);
    }
  });
});

describe('día de la semana dominante', () => {
  it('lo menciona a partir de 3 salidas', () => {
    const stats = statsWith({ weekdayDistribution: [{ day: 3, label: 'Mié', count: 3 }] });

    expect(ids(stats)).toContain('top_day');
    expect(textOf(stats, 'top_day')).toContain('miércoless');
    expect(textOf(stats, 'top_day')).toContain('(3)');
  });

  it('con menos de 3 no dice nada', () => {
    const stats = statsWith({ weekdayDistribution: [{ day: 3, label: 'Mié', count: 2 }] });
    expect(ids(stats)).not.toContain('top_day');
  });

  it('elige el día de mayor frecuencia', () => {
    const stats = statsWith({
      weekdayDistribution: [
        { day: 1, label: 'Lun', count: 4 },
        { day: 6, label: 'Sáb', count: 9 },
      ],
    });

    expect(textOf(stats, 'top_day')).toContain('sábados');
  });
});

describe('crecimiento de volumen', () => {
  const trimestres = (viejos: number, nuevos: number) =>
    statsWith({
      monthly: months(
        ['2026-01', viejos], ['2026-02', viejos], ['2026-03', viejos],
        ['2026-04', nuevos], ['2026-05', nuevos], ['2026-06', nuevos],
      ),
    });

  it('reporta el aumento a partir del 10%', () => {
    expect(ids(trimestres(100, 120))).toContain('distance_growth');
    expect(textOf(trimestres(100, 120), 'distance_growth')).toContain('20%');
  });

  it('reporta la caída a partir del -10%, sin dramatizar', () => {
    const stats = trimestres(100, 80);

    expect(ids(stats)).toContain('distance_decline');
    expect(textOf(stats, 'distance_decline')).toContain('20%');
    expect(textOf(stats, 'distance_decline')).toContain('recuperación');
  });

  it('no dice nada si el cambio es menor al 10%', () => {
    const stats = trimestres(100, 105);

    expect(ids(stats)).not.toContain('distance_growth');
    expect(ids(stats)).not.toContain('distance_decline');
  });

  it('necesita al menos 6 meses de historial', () => {
    const stats = statsWith({
      monthly: months(['2026-04', 100], ['2026-05', 100], ['2026-06', 200]),
    });

    expect(ids(stats)).not.toContain('distance_growth');
  });
});

describe('mes récord', () => {
  it('avisa cuando el mes actual es el más alto del historial', () => {
    const stats = statsWith({
      monthly: months(['2026-05', 50], ['2026-06', 80], ['2026-07', 120]),
    });

    expect(textOf(stats, 'record_month')).toContain('más alto del historial');
    expect(textOf(stats, 'record_month')).toContain('120 km');
  });

  it('si no es récord, compara contra el máximo anterior', () => {
    const stats = statsWith({
      monthly: months(['2026-05', 200], ['2026-06', 80], ['2026-07', 30]),
    });

    expect(textOf(stats, 'record_month')).toContain('200 km');
    expect(textOf(stats, 'record_month')).toContain('30 km');
  });

  it('no dice nada si el mes actual todavía no tiene km', () => {
    const stats = statsWith({ monthly: months(['2026-05', 50], ['2026-06', 80]) });
    expect(ids(stats)).not.toContain('record_month');
  });
});

describe('constancia semanal', () => {
  it('la reporta cuando entrenó al menos la mitad de las últimas 32 semanas', () => {
    const stats = statsWith({ weekly: [...weeks(16), ...weeks(16, false)] });

    expect(ids(stats)).toContain('consistency_streak');
    expect(textOf(stats, 'consistency_streak')).toContain('16 semanas');
  });

  it('no la reporta por debajo de la mitad', () => {
    const stats = statsWith({ weekly: [...weeks(15), ...weeks(17, false)] });
    expect(ids(stats)).not.toContain('consistency_streak');
  });
});

describe('mejora de ritmo', () => {
  it('la reporta a partir de 15 segundos por km', () => {
    const stats = statsWith({
      paceEvolution: paces(400, 400, 400, 400, 400, 380, 380, 380, 380, 380),
    });

    expect(ids(stats)).toContain('pace_improved');
    expect(textOf(stats, 'pace_improved')).toContain('20 seg');
  });

  it('expresa en minutos las mejoras grandes', () => {
    const stats = statsWith({
      paceEvolution: paces(400, 400, 400, 400, 400, 310, 310, 310, 310, 310),
    });

    expect(textOf(stats, 'pace_improved')).toContain('1 min');
  });

  it('omite los segundos sueltos cuando la mejora es en minutos exactos', () => {
    const stats = statsWith({
      paceEvolution: paces(400, 400, 400, 400, 400, 340, 340, 340, 340, 340),
    });

    expect(textOf(stats, 'pace_improved')).toContain('1 min');
    expect(textOf(stats, 'pace_improved')).not.toContain('seg');
  });

  it('no reporta mejoras menores a 15 segundos', () => {
    const stats = statsWith({
      paceEvolution: paces(400, 400, 400, 400, 400, 395, 395, 395, 395, 395),
    });

    expect(ids(stats)).not.toContain('pace_improved');
  });

  it('necesita al menos 10 salidas con ritmo', () => {
    const stats = statsWith({ paceEvolution: paces(400, 400, 400, 300, 300, 300) });
    expect(ids(stats)).not.toContain('pace_improved');
  });
});

describe('salida más larga', () => {
  it('destaca haber alcanzado la media maratón', () => {
    const stats = statsWith({ longestActivity: 21.1 });

    expect(textOf(stats, 'long_run')).toContain('media maratón');
  });

  it('por debajo de la media maratón sólo informa la distancia', () => {
    const stats = statsWith({ longestActivity: 12.5 });

    expect(textOf(stats, 'long_run')).toContain('12.5 km');
    expect(textOf(stats, 'long_run')).not.toContain('media maratón');
  });

  it('no dice nada por debajo de 10 km', () => {
    expect(ids(statsWith({ longestActivity: 8 }))).not.toContain('long_run');
  });

  it('21 km redondos no cuentan como media maratón', () => {
    expect(textOf(statsWith({ longestActivity: 21 }), 'long_run')).not.toContain('media maratón');
  });
});
