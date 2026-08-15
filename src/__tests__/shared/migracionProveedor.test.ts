import { computeAnnualRecap, computeMonthlyRecap } from '@/lib/recap';
import { loadCache, saveCache } from '@/lib/cache';
import { activity } from '@/__tests__/helpers/activity';

/**
 * Los dos efectos de migración que dejó la unificación del modelo de
 * actividades, y que sin test no se notan hasta que ya pasaron.
 */

describe('la caché guardada antes de que existieran los proveedores', () => {
  beforeEach(() => localStorage.clear());

  it('se descarta, porque sus actividades no tienen de qué proveedor vinieron', () => {
    // El formato viejo: la versión 1 guardaba actividades sin `provider` ni
    // `externalId`. Cargarlas colapsaría todas bajo la misma clave de
    // deduplicación y dejaría el dashboard vacío sin ningún error visible.
    localStorage.setItem(
      'platenzen_activities_cache',
      JSON.stringify({ activities: [{ id: 1, distance: 10000 }], timestamp: Date.now(), version: 1 })
    );

    expect(loadCache()).toBeNull();
  });

  it('deja leer lo que se guardó con el formato nuevo', () => {
    saveCache([activity({ id: 1 })]);

    expect(loadCache()?.activities[0].provider).toBe('strava');
  });
});

describe('el recap después de centralizar el vocabulario de deportes', () => {
  // Cambio de comportamiento deliberado: antes `recap` filtraba con
  // `sport_type` a secas, sin el respaldo `|| type` que sí usaban los demás
  // módulos. Una corrida vieja sin `sport_type` quedaba afuera del recap y
  // adentro de todo el resto — una inconsistencia, no una decisión.
  const corridaVieja = activity({
    id: 1,
    sport_type: '',
    type: 'Run',
    distance: 10000,
    start_date_local: '2026-03-15T08:00:00Z',
  });

  it('cuenta una corrida vieja a la que Strava no le mandó sport_type', () => {
    expect(computeMonthlyRecap([corridaVieja], '2026-03')?.totalActivities).toBe(1);
  });

  it('la cuenta también en el resumen anual', () => {
    expect(computeAnnualRecap([corridaVieja], 2026)?.totalActivities).toBe(1);
  });

  it('sigue sin contar lo que no es una corrida', () => {
    const bici = activity({ id: 2, sport_type: 'Ride', type: 'Ride', start_date_local: '2026-03-15T08:00:00Z' });

    expect(computeMonthlyRecap([bici], '2026-03')).toBeNull();
  });
});
