/**
 * La curva de radio del perfil de ramas: sin ella, 10% y 30% caían casi en el
 * mismo punto pegados al centro. Fija cuatro anclas concretas — el resto es
 * interpolación, y eso es lo que se verifica: que las anclas caigan exacto y
 * que los intermedios queden entre sus dos vecinas, sin saltos raros.
 */
import { radialFrac } from '@/components/PersonajeCard/branchWeb';

describe('radialFrac', () => {
  it('deja las anclas pedidas exactas: 25→40, 50→66, 75→85, 100→100', () => {
    expect(radialFrac(0.25)).toBeCloseTo(0.4);
    expect(radialFrac(0.5)).toBeCloseTo(0.66);
    expect(radialFrac(0.75)).toBeCloseTo(0.85);
    expect(radialFrac(1)).toBeCloseTo(1);
  });

  it('el 0% se queda en el centro', () => {
    expect(radialFrac(0)).toBe(0);
  });

  it('un intermedio cae entre sus dos anclas vecinas', () => {
    const mitad = radialFrac(0.125); // entre 0% (0) y 25% (0.40)
    expect(mitad).toBeGreaterThan(0);
    expect(mitad).toBeLessThan(0.4);
  });

  it('nunca crece más rápido que en línea recta: comprime, no expande', () => {
    for (const pct of [0.1, 0.2, 0.3, 0.4, 0.6, 0.8, 0.9]) {
      expect(radialFrac(pct)).toBeGreaterThanOrEqual(pct);
    }
  });

  it('recorta valores fuera de rango a [0, 1]', () => {
    expect(radialFrac(-0.5)).toBe(0);
    expect(radialFrac(1.5)).toBe(1);
  });
});
