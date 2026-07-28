import { getPaceFromActivity, mpsToSecPerKm, secPerKmToString, splitPace } from '@/utils/pace';

describe('splitPace', () => {
  it('parte el ritmo en minutos y segundos de dos dígitos', () => {
    expect(splitPace(400)).toEqual({ minutes: 6, seconds: '40' });
    expect(splitPace(305)).toEqual({ minutes: 5, seconds: '05' });
  });

  it('nunca devuelve 60 segundos: redondea el total, no los segundos sueltos', () => {
    // Regresión: redondear `secPerKm % 60` daba 60 y se imprimía "4:60".
    expect(splitPace(299.6)).toEqual({ minutes: 5, seconds: '00' });
    expect(splitPace(359.5)).toEqual({ minutes: 6, seconds: '00' });
  });

  it('los segundos quedan siempre entre 00 y 59, para cualquier ritmo', () => {
    for (let sec = 120; sec <= 720; sec += 0.1) {
      const { seconds } = splitPace(sec);
      expect(Number(seconds)).toBeGreaterThanOrEqual(0);
      expect(Number(seconds)).toBeLessThan(60);
    }
  });
});

describe('mpsToSecPerKm', () => {
  it('convierte metros por segundo a segundos por km', () => {
    // 2.5 m/s = 400 s/km = 6:40 /km
    expect(mpsToSecPerKm(2.5)).toBe(400);
    expect(mpsToSecPerKm(5)).toBe(200);
  });

  it('devuelve 0 con velocidad no positiva, en lugar de dividir por cero', () => {
    expect(mpsToSecPerKm(0)).toBe(0);
    expect(mpsToSecPerKm(-1)).toBe(0);
  });
});

describe('secPerKmToString', () => {
  it('formatea con minutos y segundos en dos dígitos', () => {
    expect(secPerKmToString(400)).toBe('6:40 /km');
    expect(secPerKmToString(305)).toBe('5:05 /km');
    expect(secPerKmToString(240)).toBe('4:00 /km');
  });

  it('redondea los segundos al entero más cercano', () => {
    expect(secPerKmToString(299.6)).toBe('5:00 /km');
  });

  it('devuelve el guión doble cuando no hay ritmo válido', () => {
    expect(secPerKmToString(0)).toBe('--');
    expect(secPerKmToString(-30)).toBe('--');
  });
});

describe('getPaceFromActivity', () => {
  it('es el ritmo derivado de average_speed', () => {
    expect(getPaceFromActivity(2.5)).toBe(mpsToSecPerKm(2.5));
  });
});
