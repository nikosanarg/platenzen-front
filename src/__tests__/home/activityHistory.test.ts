import { sortActivities } from '@/lib/activityHistory';
import { activity } from '@/__tests__/helpers/activity';

/** Los ids identifican la actividad en los asserts de orden. */
const vieja = activity({ id: 1, start_date_local: '2026-01-10T08:00:00Z', distance: 21000, moving_time: 7200, total_elevation_gain: 300 });
const media = activity({ id: 2, start_date_local: '2026-03-05T08:00:00Z', distance: 5000, moving_time: 1500, total_elevation_gain: 10 });
const nueva = activity({ id: 3, start_date_local: '2026-06-20T08:00:00Z', distance: 10000, moving_time: 3600, total_elevation_gain: 120 });

const ids = (as: ReturnType<typeof sortActivities>) => as.map(a => a.id);

describe('el orden del historial', () => {
  it('por fecha pone primero la más reciente', () => {
    expect(ids(sortActivities([vieja, media, nueva], 'fecha'))).toEqual([3, 2, 1]);
  });

  it('por distancia pone primero la más larga', () => {
    expect(ids(sortActivities([media, nueva, vieja], 'distancia'))).toEqual([1, 3, 2]);
  });

  it('por ritmo pone primero la más rápida, que no es la más larga', () => {
    // media: 5 km en 25' = 5:00/km. nueva: 10 km en 60' = 6:00/km.
    // vieja: 21 km en 120' = 5:43/km.
    expect(ids(sortActivities([vieja, media, nueva], 'ritmo'))).toEqual([2, 1, 3]);
  });

  it('por desnivel pone primero la de más metros acumulados', () => {
    expect(ids(sortActivities([media, nueva, vieja], 'desnivel'))).toEqual([1, 3, 2]);
  });

  it('manda al final las actividades sin ritmo en vez de fingir que son las más lentas', () => {
    const sinRitmo = activity({ id: 9, average_speed: 0, start_date_local: '2026-12-31T08:00:00Z' });

    const ordenadas = ids(sortActivities([sinRitmo, media, nueva], 'ritmo'));

    expect(ordenadas[ordenadas.length - 1]).toBe(9);
  });

  it('no muta el arreglo que recibe', () => {
    const original = [vieja, media, nueva];

    sortActivities(original, 'distancia');

    expect(ids(original)).toEqual([1, 2, 3]);
  });

  it('desempata por fecha, así dos actividades idénticas no cambian de lugar entre renders', () => {
    const a = activity({ id: 10, distance: 8000, start_date_local: '2026-02-01T08:00:00Z' });
    const b = activity({ id: 11, distance: 8000, start_date_local: '2026-02-02T08:00:00Z' });

    expect(ids(sortActivities([a, b], 'distancia'))).toEqual([11, 10]);
    expect(ids(sortActivities([b, a], 'distancia'))).toEqual([11, 10]);
  });
});
