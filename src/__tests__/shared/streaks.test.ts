/**
 * Rachas. Es el número que el producto usa para decirle al corredor que viene
 * sosteniendo el hábito, así que un off-by-one acá es una mentira directa.
 *
 * Todas las rachas "actuales" se comparan contra el día de hoy, así que el reloj
 * se congela en un miércoles conocido (2026-07-15) para que el test no cambie de
 * resultado según el día en que se corra.
 */
import {
  computeLongestWeeklyStreak,
  computeWeeklyStreak,
  getCurrentStreak,
  getLongestStreak,
} from '@/utils/streaks';
import { DayStats, WeeklyStats } from '@/types/stats';

const days = (...dates: string[]): DayStats[] =>
  dates.map((date) => ({ date, count: 1, distance: 5 }));

const weeks = (...mondays: string[]): WeeklyStats[] =>
  mondays.map((week) => ({ week, label: week, distance: 5, count: 1 }));

beforeEach(() => {
  jest.useFakeTimers();
  // Miércoles. El lunes de esta semana es 2026-07-13.
  jest.setSystemTime(new Date('2026-07-15T12:00:00Z'));
});

afterEach(() => {
  jest.useRealTimers();
});

describe('getCurrentStreak', () => {
  it('devuelve 0 sin días registrados', () => {
    expect(getCurrentStreak([])).toBe(0);
  });

  it('cuenta los días consecutivos que terminan hoy', () => {
    expect(getCurrentStreak(days('2026-07-13', '2026-07-14', '2026-07-15'))).toBe(3);
  });

  it('sigue contando si hoy todavía no se salió pero ayer sí', () => {
    expect(getCurrentStreak(days('2026-07-13', '2026-07-14'))).toBe(2);
  });

  it('se corta si tampoco se salió ayer', () => {
    expect(getCurrentStreak(days('2026-07-10', '2026-07-11', '2026-07-12'))).toBe(0);
  });

  it('sólo cuenta el tramo final, no el más largo del historial', () => {
    expect(
      getCurrentStreak(days('2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04', '2026-07-15')),
    ).toBe(1);
  });
});

describe('getLongestStreak', () => {
  it('devuelve 0 sin días registrados', () => {
    expect(getLongestStreak([])).toBe(0);
  });

  it('devuelve 1 con un único día', () => {
    expect(getLongestStreak(days('2026-07-15'))).toBe(1);
  });

  it('encuentra el tramo consecutivo más largo, esté donde esté', () => {
    expect(
      getLongestStreak(
        days('2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-03-01', '2026-03-02'),
      ),
    ).toBe(4);
  });

  it('no depende del orden de entrada', () => {
    expect(getLongestStreak(days('2026-01-03', '2026-01-01', '2026-01-02'))).toBe(3);
  });

  it('un salto de dos días corta la racha', () => {
    expect(getLongestStreak(days('2026-01-01', '2026-01-03', '2026-01-05'))).toBe(1);
  });
});

describe('computeWeeklyStreak', () => {
  it('devuelve 0 sin semanas activas', () => {
    expect(computeWeeklyStreak([])).toBe(0);
    expect(computeWeeklyStreak([{ week: '2026-07-13', label: '', distance: 0, count: 0 }])).toBe(0);
  });

  it('cuenta las semanas consecutivas que terminan en la actual', () => {
    expect(computeWeeklyStreak(weeks('2026-06-29', '2026-07-06', '2026-07-13'))).toBe(3);
  });

  it('cuenta la semana actual sólo si ya tiene actividad', () => {
    // Sin la semana del 13, la racha arranca en la anterior y sigue valiendo.
    expect(computeWeeklyStreak(weeks('2026-06-29', '2026-07-06'))).toBe(2);
  });

  it('una semana vacía en el medio corta la racha', () => {
    expect(computeWeeklyStreak(weeks('2026-06-22', '2026-07-06', '2026-07-13'))).toBe(2);
  });

  it('un domingo pertenece a la semana que arrancó el lunes anterior', () => {
    jest.setSystemTime(new Date('2026-07-19T12:00:00Z')); // domingo
    expect(computeWeeklyStreak(weeks('2026-07-06', '2026-07-13'))).toBe(2);
  });
});

describe('computeLongestWeeklyStreak', () => {
  it('devuelve 0 sin días activos', () => {
    expect(computeLongestWeeklyStreak([])).toBe(0);
  });

  it('cuenta una sola vez la semana con varias salidas', () => {
    expect(computeLongestWeeklyStreak(days('2026-07-13', '2026-07-14', '2026-07-15'))).toBe(1);
  });

  it('encadena semanas consecutivas', () => {
    expect(computeLongestWeeklyStreak(days('2026-06-29', '2026-07-06', '2026-07-13'))).toBe(3);
  });

  it('cruza el límite de mes y de año sin cortar', () => {
    // Lunes 2025-12-22, 2025-12-29 y 2026-01-05: tres semanas seguidas.
    expect(computeLongestWeeklyStreak(days('2025-12-22', '2025-12-29', '2026-01-05'))).toBe(3);
  });

  it('devuelve el tramo más largo, no el último', () => {
    expect(
      computeLongestWeeklyStreak(days('2026-01-05', '2026-01-12', '2026-01-19', '2026-07-13')),
    ).toBe(3);
  });
});
