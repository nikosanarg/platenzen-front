/**
 * Mapea conteos nominales a uno de 11 niveles de color (0 a 10 = 0% a 100%
 * de `maxCount`), preservando el orden: a mayor conteo, mismo nivel o
 * mayor, nunca menor. Con pocas actividades varios conteos distintos caen
 * en el mismo nivel redondeado (ej. 25 y 26 sobre un máximo de 100 son
 * ambos "nivel 3") — en vez de pintarlos igual, el que le sigue se empuja
 * al próximo nivel libre. Barato: un sort de los valores distintos (a lo
 * sumo 168, una celda por hora en la semana) y una pasada lineal.
 */
const HEAT_LEVELS = 10;

export function buildHeatLevelMap(counts: number[], maxCount: number): Map<number, number> {
  const levelMap = new Map<number, number>();
  if (maxCount <= 0) return levelMap;

  const distinct = Array.from(new Set(counts.filter((c) => c > 0))).sort((a, b) => a - b);
  let lastLevel = 0;
  for (const count of distinct) {
    const raw = Math.round((count / maxCount) * HEAT_LEVELS);
    const level = Math.min(HEAT_LEVELS, Math.max(raw, lastLevel + 1));
    levelMap.set(count, level);
    lastLevel = level;
  }
  return levelMap;
}

export function getHeatLevel(count: number, levelMap: Map<number, number>): number {
  if (count <= 0) return 0;
  return levelMap.get(count) ?? 0;
}
