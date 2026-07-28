/**
 * Umbrales y pesos de los roles. Son configuración pura, pero tienen invariantes
 * que ningún test de nivel superior detectaría: los pesos de afinidad de cada
 * rama tienen que sumar 100 (si no, la afinidad no llega nunca al 100% o lo
 * pasa), y los umbrales de cada rama tienen que ser crecientes (si no, un rol
 * avanzado se desbloquea antes que el básico).
 */
import {
  ACHIEVEMENT_AFINIDAD,
  ACHIEVEMENT_THRESHOLDS,
  DISTANCE_AFINIDAD,
  DISTANCE_THRESHOLDS,
  EXPLORATION_AFINIDAD,
  EXPLORATION_DISTINCT_PLACES,
  EXPLORATION_THRESHOLDS,
  MILESTONE_KM,
  SPEED_AFINIDAD,
  SPEED_THRESHOLDS,
} from '@/lib/roleThresholds';
import { HALF_MARATHON_KM, MARATHON_KM } from '@/lib/distances';

describe('pesos de afinidad', () => {
  it('la rama de distancia suma 100', () => {
    expect(
      DISTANCE_AFINIDAD.maxPts_weekly +
        DISTANCE_AFINIDAD.maxPts_longest +
        DISTANCE_AFINIDAD.maxPts_longRatio,
    ).toBe(100);
  });

  it('la rama de velocidad suma 100', () => {
    expect(SPEED_AFINIDAD.maxPts_pace + SPEED_AFINIDAD.maxPts_frequency).toBe(100);
  });

  it('la rama de exploración suma 100', () => {
    expect(
      EXPLORATION_AFINIDAD.maxPts_trailRatio +
        EXPLORATION_AFINIDAD.maxPts_totalKm +
        EXPLORATION_AFINIDAD.maxPts_elevation,
    ).toBe(100);
  });

  it('los valores de referencia son positivos: se usan como divisores', () => {
    expect(DISTANCE_AFINIDAD.reference_weekly_km).toBeGreaterThan(0);
    expect(DISTANCE_AFINIDAD.reference_long_km).toBeGreaterThan(0);
    expect(EXPLORATION_AFINIDAD.reference_total_km).toBeGreaterThan(0);
    expect(EXPLORATION_AFINIDAD.reference_elevation).toBeGreaterThan(0);
    expect(ACHIEVEMENT_AFINIDAD.reference_activities).toBeGreaterThan(0);
    expect(ACHIEVEMENT_AFINIDAD.reference_km).toBeGreaterThan(0);
  });
});

describe('umbrales crecientes por rama', () => {
  it('distancia: fondista < ultrafondista < maratonista', () => {
    expect(DISTANCE_THRESHOLDS.fondista_weekly_km).toBeLessThan(
      DISTANCE_THRESHOLDS.ultrafondista_weekly_km,
    );
    expect(DISTANCE_THRESHOLDS.fondista_longest_km).toBeLessThan(
      DISTANCE_THRESHOLDS.ultrafondista_longest_km,
    );
    expect(DISTANCE_THRESHOLDS.ultrafondista_longest_km).toBeLessThan(
      DISTANCE_THRESHOLDS.maratonista_longest_km,
    );
  });

  it('distancia: usa las distancias oficiales exactas, no redondeadas', () => {
    expect(DISTANCE_THRESHOLDS.ultrafondista_longest_km).toBe(HALF_MARATHON_KM);
    expect(DISTANCE_THRESHOLDS.maratonista_longest_km).toBe(MARATHON_KM);
  });

  it('velocidad: el umbral de velocista es más exigente que el de pasadista', () => {
    // Menos segundos por km es más rápido.
    expect(SPEED_THRESHOLDS.velocista_pace_sec).toBeLessThan(SPEED_THRESHOLDS.pasadista_pace_sec);
  });

  it('velocidad: el ritmo de referencia mejor es más rápido que el peor', () => {
    expect(SPEED_AFINIDAD.reference_best_pace).toBeLessThan(SPEED_AFINIDAD.reference_worst_pace);
  });

  it('exploración: trotamundos < conquistador en km y ratio de trail', () => {
    expect(EXPLORATION_THRESHOLDS.trotamundos_total_km).toBeLessThan(
      EXPLORATION_THRESHOLDS.conquistador_total_km,
    );
    expect(EXPLORATION_THRESHOLDS.trotamundos_trail_ratio).toBeLessThan(
      EXPLORATION_THRESHOLDS.conquistador_trail_ratio,
    );
  });

  it('exploración: los ratios de trail son proporciones entre 0 y 1', () => {
    expect(EXPLORATION_THRESHOLDS.trotamundos_trail_ratio).toBeGreaterThan(0);
    expect(EXPLORATION_THRESHOLDS.conquistador_trail_ratio).toBeLessThanOrEqual(1);
  });

  it('exploración: los lugares distintos crecen con el rol', () => {
    expect(EXPLORATION_DISTINCT_PLACES.explorador_min_places).toBeLessThan(
      EXPLORATION_DISTINCT_PLACES.trotamundos_min_places,
    );
    expect(EXPLORATION_DISTINCT_PLACES.trotamundos_min_places).toBeLessThan(
      EXPLORATION_DISTINCT_PLACES.conquistador_min_places,
    );
  });

  it('logros: competidor < coleccionador < medallista', () => {
    expect(ACHIEVEMENT_THRESHOLDS.competidor_min_activities).toBeLessThan(
      ACHIEVEMENT_THRESHOLDS.coleccionador_min_activities,
    );
    expect(ACHIEVEMENT_THRESHOLDS.coleccionador_min_activities).toBeLessThan(
      ACHIEVEMENT_THRESHOLDS.medallista_min_activities,
    );
    expect(ACHIEVEMENT_THRESHOLDS.coleccionador_min_total_km).toBeLessThan(
      ACHIEVEMENT_THRESHOLDS.medallista_min_total_km,
    );
  });

  it('logros: no se piden más hitos que los que existen', () => {
    expect(ACHIEVEMENT_THRESHOLDS.medallista_min_milestones).toBe(MILESTONE_KM.length);
    expect(ACHIEVEMENT_THRESHOLDS.coleccionador_min_milestones).toBeLessThanOrEqual(
      MILESTONE_KM.length,
    );
    expect(ACHIEVEMENT_AFINIDAD.total_milestones).toBe(MILESTONE_KM.length);
  });
});

describe('MILESTONE_KM', () => {
  it('está ordenado de menor a mayor', () => {
    expect([...MILESTONE_KM]).toEqual([...MILESTONE_KM].sort((a, b) => a - b));
  });

  it('cierra con las distancias oficiales de media y maratón', () => {
    expect(MILESTONE_KM).toContain(HALF_MARATHON_KM);
    expect(MILESTONE_KM).toContain(MARATHON_KM);
  });
});
