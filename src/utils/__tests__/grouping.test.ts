/**
 * Agrupaciones por mes, semana y día. Alimentan los gráficos y el promedio
 * semanal, así que un bucket mal armado corre el volumen de un período a otro.
 *
 * Las fixtures usan hora 12:00Z a propósito: cualquier huso entre UTC-11 y
 * UTC+11 cae en el mismo día calendario, así que el test no depende de la zona
 * horaria de la máquina.
 */
import { getMonthKey, getWeekKey, groupByDay, groupByMonth, groupByWeek } from '@/utils/grouping';
import { activity } from '@/__tests__/helpers/activity';

const on = (date: string, distance: number, id = 1) =>
  activity({ id, distance, start_date_local: `${date}T12:00:00Z` });

describe('getMonthKey', () => {
  it('devuelve YYYY-MM con el mes en dos dígitos', () => {
    expect(getMonthKey(new Date(2026, 0, 15))).toBe('2026-01');
    expect(getMonthKey(new Date(2026, 10, 3))).toBe('2026-11');
  });
});

describe('getWeekKey', () => {
  it('agrupa lunes a domingo en la misma clave', () => {
    // 2026-01-05 es lunes; 2026-01-11, el domingo siguiente.
    expect(getWeekKey(new Date(2026, 0, 5))).toBe(getWeekKey(new Date(2026, 0, 11)));
  });

  it('separa el domingo de la semana siguiente', () => {
    expect(getWeekKey(new Date(2026, 0, 11))).not.toBe(getWeekKey(new Date(2026, 0, 12)));
  });
});

describe('groupByMonth', () => {
  it('suma distancia, tiempo y cantidad por mes', () => {
    const months = groupByMonth([
      on('2026-01-05', 5000, 1),
      on('2026-01-20', 10000, 2),
      on('2026-02-02', 8000, 3),
    ]);

    expect(months).toHaveLength(2);
    expect(months[0].month).toBe('2026-01');
    expect(months[0].distance).toBeCloseTo(15, 6);
    expect(months[0].count).toBe(2);
    expect(months[1].month).toBe('2026-02');
    expect(months[1].count).toBe(1);
  });

  it('ordena cronológicamente aunque la entrada esté desordenada', () => {
    const months = groupByMonth([on('2026-03-01', 5000, 1), on('2026-01-01', 5000, 2)]);
    expect(months.map((m) => m.month)).toEqual(['2026-01', '2026-03']);
  });

  it('etiqueta con mes abreviado en castellano y año', () => {
    expect(groupByMonth([on('2026-01-05', 5000)])[0].label).toBe('Ene 2026');
  });

  it('devuelve vacío sin actividades', () => {
    expect(groupByMonth([])).toEqual([]);
  });
});

describe('groupByWeek', () => {
  it('junta en un bucket las salidas de la misma semana', () => {
    const weeks = groupByWeek([on('2026-01-05', 5000, 1), on('2026-01-08', 5000, 2)]);

    expect(weeks).toHaveLength(1);
    expect(weeks[0].count).toBe(2);
    expect(weeks[0].distance).toBeCloseTo(10, 6);
  });

  it('separa semanas distintas', () => {
    expect(groupByWeek([on('2026-01-05', 5000, 1), on('2026-01-15', 5000, 2)])).toHaveLength(2);
  });
});

describe('groupByDay', () => {
  it('acumula varias salidas del mismo día en una entrada', () => {
    const days = groupByDay([on('2026-01-05', 5000, 1), on('2026-01-05', 3000, 2)]);

    expect(days).toHaveLength(1);
    expect(days[0].count).toBe(2);
    expect(days[0].distance).toBeCloseTo(8, 6);
  });

  it('ordena por fecha ascendente', () => {
    const days = groupByDay([on('2026-01-09', 5000, 1), on('2026-01-05', 5000, 2)]);
    expect(days.map((d) => d.date)).toEqual(['2026-01-05', '2026-01-09']);
  });
});
