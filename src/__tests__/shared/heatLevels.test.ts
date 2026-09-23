/**
 * `buildHeatLevelMap` traduce conteos nominales a uno de 11 niveles de color
 * (0 a 10). La regla no negociable: a mayor conteo, el nivel nunca baja — ni
 * siquiera cuando el redondeo natural haría que dos conteos distintos
 * empataran en el mismo nivel.
 */
import { buildHeatLevelMap, getHeatLevel } from '@/lib/heatLevels';

describe('buildHeatLevelMap', () => {
  it('sin actividades, el mapa queda vacío', () => {
    expect(buildHeatLevelMap([], 0).size).toBe(0);
  });

  it('el 0 nunca entra en el mapa: getHeatLevel lo resuelve directo a nivel 0', () => {
    const map = buildHeatLevelMap([0, 5, 10], 10);
    expect(map.has(0)).toBe(false);
    expect(getHeatLevel(0, map)).toBe(0);
  });

  it('reparte proporcionalmente cuando no hay colisiones', () => {
    const map = buildHeatLevelMap([1, 2, 3], 3);
    expect(map.get(1)).toBe(3); // 1/3 -> 3.33 -> 3
    expect(map.get(2)).toBe(7); // 2/3 -> 6.67 -> 7
    expect(map.get(3)).toBe(10); // 3/3 -> 10
  });

  it('cuando el redondeo empata dos conteos, el segundo se empuja al próximo nivel', () => {
    // 25/100 -> 2.5 -> redondea a 3; 26/100 -> 2.6 -> también redondea a 3.
    const map = buildHeatLevelMap([24, 25, 26], 100);
    expect(map.get(24)).toBe(2);
    expect(map.get(25)).toBe(3);
    expect(map.get(26)).toBe(4); // empujado: 3 ya estaba tomado por el 25
  });

  it('nunca asigna nivel 0 a un conteo positivo, incluso si el redondeo natural daría 0', () => {
    const map = buildHeatLevelMap([1], 1000);
    expect(map.get(1)).toBe(1);
  });

  it('el orden de entrada no cambia el resultado: se ordena internamente', () => {
    const ascending = buildHeatLevelMap([24, 25, 26], 100);
    const shuffled = buildHeatLevelMap([26, 24, 25], 100);
    expect(shuffled).toEqual(ascending);
  });

  it('el máximo siempre llega a nivel 10', () => {
    const map = buildHeatLevelMap([1, 2, 3, 4, 5], 5);
    expect(map.get(5)).toBe(10);
  });

  it('con más de 10 valores distintos, los que sobran comparten el nivel más alto', () => {
    const counts = Array.from({ length: 15 }, (_, i) => i + 1); // 1..15
    const map = buildHeatLevelMap(counts, 15);
    const levels = counts.map((c) => map.get(c));
    // Estrictamente no decreciente, nunca supera 10.
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]).toBeGreaterThanOrEqual(levels[i - 1] as number);
    }
    expect(Math.max(...(levels as number[]))).toBe(10);
  });
});
