/**
 * Las distancias oficiales son la base de los logros de distancia y del récord
 * del hero. Si se redondean, una salida de 42 km pasa a contar como maratón
 * cuando en realidad quedó 195 m corta.
 */
import {
  CORE_DISTANCES,
  HALF_MARATHON_KM,
  HALF_MARATHON_M,
  MARATHON_KM,
  MARATHON_M,
  formatKmExact,
} from '@/lib/distances';

describe('constantes de distancia', () => {
  it('usa las distancias oficiales exactas, no redondeadas', () => {
    expect(HALF_MARATHON_KM).toBe(21.0975);
    expect(MARATHON_KM).toBe(42.195);
    expect(HALF_MARATHON_M).toBe(21097.5);
    expect(MARATHON_M).toBe(42195);
  });

  it('no considera maratón una salida de 42 km redondos', () => {
    expect(42000 >= MARATHON_M).toBe(false);
    expect(42195 >= MARATHON_M).toBe(true);
  });

  it('no considera media maratón una salida de 21 km redondos', () => {
    expect(21000 >= HALF_MARATHON_M).toBe(false);
  });
});

describe('CORE_DISTANCES', () => {
  it('está ordenado de menor a mayor: computeCoreRecord depende de eso', () => {
    const kms = CORE_DISTANCES.map((d) => d.km);
    expect(kms).toEqual([...kms].sort((a, b) => a - b));
  });

  it('mantiene metros y km coherentes entre sí', () => {
    for (const d of CORE_DISTANCES) {
      expect(d.meters).toBeCloseTo(d.km * 1000, 5);
    }
  });

  it('cubre las cinco distancias del récord del hero', () => {
    expect(CORE_DISTANCES.map((d) => d.label)).toEqual(['5K', '10K', '21K', '42K', '100K']);
  });
});

describe('formatKmExact', () => {
  it('usa coma decimal (locale es-AR)', () => {
    expect(formatKmExact(21.0975)).toBe('21,0975');
    expect(formatKmExact(42.195)).toBe('42,195');
  });

  it('corta en cuatro decimales', () => {
    expect(formatKmExact(1.234567)).toBe('1,2346');
  });

  it('no agrega decimales a los enteros', () => {
    expect(formatKmExact(10)).toBe('10');
  });
});
