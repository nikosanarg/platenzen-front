/**
 * Logros ("Permisos"). Cada uno tiene un umbral y una fecha de desbloqueo, y
 * ambos son visibles: el umbral define si el logro se otorga y la fecha alimenta
 * el glow de frescura de la tarjeta. Un umbral corrido regala o retacea logros.
 *
 * Los desbloqueos se fechan con la actividad que los cruzó, no con hoy.
 */
import { CATEGORY_LABELS, computeAchievements, getUpcomingAchievements } from '@/lib/achievements';
import { computeStats } from '@/lib/stats';
import { activity } from '@/__tests__/helpers/activity';
import { StravaActivity } from '@/types/strava';

const on = (date: string, over: Partial<StravaActivity> = {}) =>
  activity({ start_date_local: `${date}T12:00:00Z`, start_date: `${date}T12:00:00Z`, ...over });

const mapOf = (acts: StravaActivity[]) => computeAchievements(acts, computeStats(acts));

const find = (acts: StravaActivity[], id: string) =>
  Object.values(mapOf(acts))
    .flat()
    .find((a) => a.id === id)!;

describe('computeAchievements: estructura', () => {
  const map = mapOf([]);

  it('devuelve las cinco categorías, siempre', () => {
    expect(Object.keys(map).sort()).toEqual([
      'consistency', 'distance', 'exploration', 'speed', 'volume',
    ]);
  });

  it('sin actividades no desbloquea nada, pero lista todos los logros', () => {
    const all = Object.values(map).flat();

    expect(all.length).toBeGreaterThan(20);
    expect(all.every((a) => !a.unlocked)).toBe(true);
    expect(all.every((a) => a.unlockedAt === null)).toBe(true);
  });

  it('los ids no se repiten entre categorías', () => {
    const ids = Object.values(map).flat().map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('tiene una etiqueta por categoría', () => {
    expect(Object.keys(CATEGORY_LABELS).sort()).toEqual(Object.keys(map).sort());
  });
});

describe('logros de distancia', () => {
  it('desbloquea el 5K con una salida de 5 km', () => {
    const logro = find([on('2026-03-25', { distance: 5000, moving_time: 1500 })], 'first5k');

    expect(logro.unlocked).toBe(true);
    expect(logro.unlockedAt).toBe('2026-03-25');
  });

  it('no desbloquea el 5K con 4.9 km', () => {
    expect(find([on('2026-03-25', { distance: 4900, moving_time: 1500 })], 'first5k').unlocked).toBe(false);
  });

  it('exige la media maratón exacta: 21 km redondos no alcanzan', () => {
    expect(find([on('2026-05-17', { distance: 21000, moving_time: 7000 })], 'first21k').unlocked).toBe(false);
    expect(find([on('2026-05-17', { distance: 21097.5, moving_time: 7000 })], 'first21k').unlocked).toBe(true);
  });

  it('exige la maratón exacta: 42 km redondos no alcanzan', () => {
    expect(find([on('2026-05-17', { distance: 42000, moving_time: 14000 })], 'first42k').unlocked).toBe(false);
    expect(find([on('2026-05-17', { distance: 42195, moving_time: 14000 })], 'first42k').unlocked).toBe(true);
  });

  it('fecha el desbloqueo con la primera salida que cruzó el umbral', () => {
    const logro = find(
      [
        on('2026-01-10', { id: 1, distance: 6000, moving_time: 1800 }),
        on('2026-02-10', { id: 2, distance: 12000, moving_time: 3600 }),
      ],
      'first5k',
    );

    expect(logro.unlockedAt).toBe('2026-01-10');
  });

  it('una salida larga desbloquea también los umbrales menores', () => {
    const acts = [on('2026-05-17', { distance: 21097.5, moving_time: 7000 })];

    expect(find(acts, 'first5k').unlocked).toBe(true);
    expect(find(acts, 'first10k').unlocked).toBe(true);
    expect(find(acts, 'first15k').unlocked).toBe(true);
    expect(find(acts, 'first31k').unlocked).toBe(false);
  });

  it('ignora las actividades que no son de running', () => {
    const acts = [on('2026-05-17', { sport_type: 'Ride', type: 'Ride', distance: 40000, moving_time: 5000 })];
    expect(find(acts, 'first5k').unlocked).toBe(false);
  });
});

describe('logros de volumen', () => {
  it('acumula km del historial completo, no de una salida', () => {
    const acts = Array.from({ length: 10 }, (_, i) =>
      on('2026-02-01', { id: i + 1, distance: 10000, moving_time: 3000 }),
    );

    expect(find(acts, 'vol100').unlocked).toBe(true);
    expect(find(acts, 'vol250').unlocked).toBe(false);
  });

  it('fecha el desbloqueo en la salida que cruzó el acumulado', () => {
    const acts = [
      on('2026-01-01', { id: 1, distance: 60000, moving_time: 18000 }),
      on('2026-02-08', { id: 2, distance: 50000, moving_time: 15000 }),
    ];

    // A los 110 km acumulados, en la segunda salida.
    expect(find(acts, 'vol100').unlockedAt).toBe('2026-02-08');
  });

  it('el progreso llega a 1 recién cuando se alcanza el objetivo', () => {
    const parcial = find([on('2026-01-01', { distance: 50000, moving_time: 15000 })], 'vol100');
    expect(parcial.progress).toBeCloseTo(0.5, 6);
    expect(parcial.progress).toBeLessThan(1);
  });
});

describe('logros de consistencia', () => {
  it('desbloquea las 10 actividades con la décima salida', () => {
    const acts = Array.from({ length: 10 }, (_, i) =>
      on(`2026-01-${String(i + 1).padStart(2, '0')}`, { id: i + 1, distance: 5000, moving_time: 1500 }),
    );
    const logro = find(acts, 'act10');

    expect(logro.unlocked).toBe(true);
    expect(logro.unlockedAt).toBe('2026-01-10');
  });

  it('con 9 actividades todavía no lo desbloquea', () => {
    const acts = Array.from({ length: 9 }, (_, i) =>
      on(`2026-01-${String(i + 1).padStart(2, '0')}`, { id: i + 1, distance: 5000, moving_time: 1500 }),
    );

    expect(find(acts, 'act10').unlocked).toBe(false);
  });

  it('desbloquea la semana triple con 3 salidas en la misma semana', () => {
    const acts = [
      on('2026-07-13', { id: 1, distance: 5000, moving_time: 1500 }),
      on('2026-07-14', { id: 2, distance: 5000, moving_time: 1500 }),
      on('2026-07-15', { id: 3, distance: 5000, moving_time: 1500 }),
    ];

    expect(find(acts, 'week3').unlocked).toBe(true);
    expect(find(acts, 'week4').unlocked).toBe(false);
  });

  it('3 salidas repartidas en semanas distintas no cuentan como semana triple', () => {
    const acts = [
      on('2026-06-29', { id: 1, distance: 5000, moving_time: 1500 }),
      on('2026-07-06', { id: 2, distance: 5000, moving_time: 1500 }),
      on('2026-07-13', { id: 3, distance: 5000, moving_time: 1500 }),
    ];

    expect(find(acts, 'week3').unlocked).toBe(false);
  });
});

describe('logros de velocidad', () => {
  it('desbloquea el umbral cuando el ritmo lo mejora', () => {
    // 5 km en 25 min = 5:00/km exactos.
    const acts = [on('2026-07-07', { distance: 5000, moving_time: 1500 })];

    expect(find(acts, 'pace600').unlocked).toBe(true);
    expect(find(acts, 'pace530').unlocked).toBe(true);
    expect(find(acts, 'pace500').unlocked).toBe(true);
    expect(find(acts, 'pace430').unlocked).toBe(false);
  });

  it('exige 3 km o más: una salida corta y rápida no cuenta', () => {
    const acts = [on('2026-07-07', { distance: 2000, moving_time: 480 })]; // 4:00/km
    expect(find(acts, 'pace600').unlocked).toBe(false);
  });

  it('el progreso es 0 si no hay ninguna salida medible', () => {
    expect(find([], 'pace600').progress).toBe(0);
  });
});

describe('getUpcomingAchievements', () => {
  it('devuelve como máximo 6 logros', () => {
    const acts = [on('2026-07-07', { distance: 6000, moving_time: 1800 })];
    expect(getUpcomingAchievements(mapOf(acts)).length).toBeLessThanOrEqual(6);
  });

  it('excluye los ya desbloqueados', () => {
    const acts = [on('2026-07-07', { distance: 6000, moving_time: 1800 })];
    expect(getUpcomingAchievements(mapOf(acts)).every((a) => !a.unlocked)).toBe(true);
  });

  it('excluye los que todavía no arrancaron (progreso 0)', () => {
    const acts = [on('2026-07-07', { distance: 6000, moving_time: 1800 })];
    expect(getUpcomingAchievements(mapOf(acts)).every((a) => a.progress > 0)).toBe(true);
  });

  it('ordena del más cercano al más lejano', () => {
    const acts = [on('2026-07-07', { distance: 6000, moving_time: 1800 })];
    const progresos = getUpcomingAchievements(mapOf(acts)).map((a) => a.progress);

    expect(progresos).toEqual([...progresos].sort((a, b) => b - a));
  });
});
