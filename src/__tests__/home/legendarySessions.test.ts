/**
 * Sesiones legendarias: cuatro tarjetas, una por categoría, y la garantía de que
 * son cuatro actividades distintas. La asignación es greedy en orden de
 * prioridad (distancia → ritmo → hito → ritmo en largo): cada categoría toma su
 * mejor candidata que no haya sido tomada por una anterior. Si se rompe, la
 * misma salida aparece repetida en dos tarjetas.
 */
import { computeLegendarySessions } from '@/lib/legendarySessions';
import { activity } from '@/__tests__/helpers/activity';
import { StravaActivity } from '@/types/strava';

const on = (date: string, over: Partial<StravaActivity> = {}) =>
  activity({ start_date_local: `${date}T12:00:00Z`, start_date: `${date}T12:00:00Z`, ...over });

describe('computeLegendarySessions', () => {
  it('devuelve vacío sin actividades', () => {
    expect(computeLegendarySessions([])).toEqual([]);
  });

  it('devuelve vacío si no hay ninguna corrida', () => {
    const acts = [on('2026-01-01', { sport_type: 'Ride', type: 'Ride', distance: 40000, moving_time: 3600 })];
    expect(computeLegendarySessions(acts)).toEqual([]);
  });

  it('con una sola corrida no repite: devuelve menos de cuatro tarjetas', () => {
    const sesiones = computeLegendarySessions([on('2026-01-01', { distance: 5000, moving_time: 1500 })]);
    const ids = sesiones.map((s) => s.activity.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('nunca repite la misma actividad entre tarjetas', () => {
    const acts = [
      on('2026-01-05', { id: 1, distance: 42195, moving_time: 14000 }),
      on('2026-02-05', { id: 2, distance: 5000, moving_time: 1200 }),
      on('2026-03-05', { id: 3, distance: 21097.5, moving_time: 6600 }),
      on('2026-04-05', { id: 4, distance: 16000, moving_time: 5000 }),
      on('2026-05-05', { id: 5, distance: 10000, moving_time: 2900 }),
    ];
    const ids = computeLegendarySessions(acts).map((s) => s.activity.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('la primera tarjeta es la distancia más larga', () => {
    const acts = [
      on('2026-01-05', { id: 1, distance: 10000, moving_time: 3000 }),
      on('2026-02-05', { id: 2, distance: 30000, moving_time: 10000 }),
    ];
    const [primera] = computeLegendarySessions(acts);

    expect(primera.category).toBe('distancia');
    expect(primera.activity.id).toBe(2);
    expect(primera.reason).toBe('Distancia más larga');
  });

  it('el ritmo más rápido ignora las salidas de menos de 3 km', () => {
    const acts = [
      on('2026-01-05', { id: 1, distance: 10000, moving_time: 3000 }), // 5:00/km
      on('2026-02-05', { id: 2, distance: 2000, moving_time: 400 }),   // 3:20/km pero corta
      on('2026-03-05', { id: 3, distance: 5000, moving_time: 1400 }),  // 4:40/km
    ];
    const ritmo = computeLegendarySessions(acts).find((s) => s.category === 'ritmo');

    expect(ritmo?.activity.id).toBe(3);
  });

  it('el hito toma la primera salida en alcanzar la distancia, no la más rápida', () => {
    const acts = [
      on('2026-01-05', { id: 1, distance: 21097.5, moving_time: 7200 }),
      on('2026-02-05', { id: 2, distance: 21097.5, moving_time: 6600 }),
      on('2026-03-05', { id: 3, distance: 5000, moving_time: 1300 }),
      on('2026-04-05', { id: 4, distance: 30000, moving_time: 11000 }),
    ];
    const hito = computeLegendarySessions(acts).find((s) => s.category === 'hito');

    // La #1 es la primera media maratón, aunque la #2 sea más rápida.
    expect(hito?.activity.id).toBe(1);
  });

  it('el mejor ritmo en largo exige 15 km o más', () => {
    const acts = [
      on('2026-01-05', { id: 1, distance: 30000, moving_time: 11000 }),
      on('2026-02-05', { id: 2, distance: 5000, moving_time: 1200 }),
      on('2026-03-05', { id: 3, distance: 16000, moving_time: 5000 }),
      on('2026-04-05', { id: 4, distance: 10000, moving_time: 2900 }),
    ];
    const largo = computeLegendarySessions(acts).find((s) => s.category === 'ritmo_largo');

    expect(largo).toBeDefined();
    expect(largo!.activity.distance).toBeGreaterThanOrEqual(15000);
  });
});

describe('formato de las tarjetas', () => {
  const [tarjeta] = computeLegendarySessions([
    on('2026-07-15', { id: 99, distance: 21097.5, moving_time: 6600 }),
  ]);

  it('muestra la distancia con dos decimales', () => {
    expect(tarjeta.distanceKm).toBe('21.10');
  });

  it('muestra el ritmo por km', () => {
    expect(tarjeta.pace).toMatch(/^\d+:\d{2}\/km$/);
  });

  it('escribe la fecha con el mes completo en castellano', () => {
    expect(tarjeta.dateLabel).toContain('Julio');
    expect(tarjeta.dateLabel).toContain('2026');
  });

  it('enlaza a la actividad en Strava por id', () => {
    expect(tarjeta.stravaUrl).toBe('https://www.strava.com/activities/99');
  });

  it('trae un emoji para el encabezado', () => {
    expect(tarjeta.icon.length).toBeGreaterThan(0);
  });

  it('no imprime 60 segundos cuando el ritmo redondea hacia arriba', () => {
    // 10 km a 2.9993... m/s ≈ 333.4 s/km. Regresión del "M:60/km".
    const [tarjeta60] = computeLegendarySessions([
      on('2026-07-15', { id: 1, distance: 10000, moving_time: 3596 }),
    ]);

    expect(tarjeta60.pace).not.toMatch(/:60\/km$/);
  });

  it('muestra guión si la actividad no tiene velocidad', () => {
    const [sinRitmo] = computeLegendarySessions([
      on('2026-07-15', { id: 1, distance: 5000, moving_time: 1500, average_speed: 0 }),
    ]);

    expect(sinRitmo.pace).toBe('—');
  });
});
