import { mergeActivities } from '@/lib/mergeActivities';
import { activity } from '@/__tests__/helpers/activity';
import type { Activity } from '@/types/activity';

/**
 * La deduplicación es lo que hace que sincronizar dos veces sea seguro y que
 * dos proveedores puedan convivir. Su clave es `provider + externalId`, no el
 * `id`: ese es el punto entero y el que estos tests fijan.
 */

function enFecha(fecha: string, overrides: Partial<Activity> = {}): Activity {
  return activity({ start_date: fecha, start_date_local: fecha, ...overrides });
}

describe('mergeActivities', () => {
  it('deja una sola copia cuando la misma actividad llega dos veces', () => {
    const a = activity({ id: 1 });

    expect(mergeActivities([a], [a])).toHaveLength(1);
  });

  it('hace que resincronizar sea idempotente: dos corridas de lo mismo no duplican nada', () => {
    const historial = [activity({ id: 1 }), activity({ id: 2 }), activity({ id: 3 })];

    expect(mergeActivities(historial, historial)).toHaveLength(3);
  });

  it('no colapsa dos proveedores que emitieron el mismo id numérico', () => {
    const strava = activity({ id: 42, provider: 'strava', externalId: '42' });
    const garmin = activity({ id: 42, provider: 'garmin', externalId: '42' });

    expect(mergeActivities([strava], [garmin])).toHaveLength(2);
  });

  it('sí colapsa dos entradas del mismo proveedor con el mismo externalId aunque difiera el id', () => {
    const primera = activity({ id: 1, provider: 'strava', externalId: 'x' });
    const segunda = activity({ id: 999, provider: 'strava', externalId: 'x' });

    expect(mergeActivities([primera], [segunda])).toHaveLength(1);
  });

  it('deja ganar a la última, para que un dato corregido por el proveedor reemplace al viejo', () => {
    const vieja = activity({ id: 1, distance: 5000 });
    const corregida = activity({ id: 1, distance: 5300 });

    expect(mergeActivities([vieja], [corregida])[0].distance).toBe(5300);
  });

  it('devuelve de más reciente a más antigua, que es como el dominio espera las actividades', () => {
    const mayo = enFecha('2026-05-01T10:00:00Z', { id: 1 });
    const enero = enFecha('2026-01-01T10:00:00Z', { id: 2 });
    const marzo = enFecha('2026-03-01T10:00:00Z', { id: 3 });

    expect(mergeActivities([enero, mayo, marzo]).map((a) => a.id)).toEqual([1, 3, 2]);
  });

  it('ordena también cuando las actividades vienen de listas distintas', () => {
    const mayo = enFecha('2026-05-01T10:00:00Z', { id: 1, provider: 'strava', externalId: 's1' });
    const marzo = enFecha('2026-03-01T10:00:00Z', { id: 2, provider: 'garmin', externalId: 'g1' });

    expect(mergeActivities([marzo], [mayo]).map((a) => a.provider)).toEqual(['strava', 'garmin']);
  });

  it('devuelve lista vacía sin argumentos y sin listas con contenido', () => {
    expect(mergeActivities()).toEqual([]);
    expect(mergeActivities([], [])).toEqual([]);
  });
});
