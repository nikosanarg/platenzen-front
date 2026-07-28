import {
  formatDistance,
  formatElevation,
  kmToString,
  metersToKm,
  secondsToHMS,
  secondsToHours,
} from '@/utils/units';

describe('metersToKm', () => {
  it('divide por mil sin redondear', () => {
    expect(metersToKm(21097.5)).toBe(21.0975);
    expect(metersToKm(0)).toBe(0);
  });
});

describe('kmToString', () => {
  it('usa un decimal por defecto', () => {
    expect(kmToString(10)).toBe('10.0 km');
    expect(kmToString(21.0975)).toBe('21.1 km');
  });

  it('respeta la cantidad de decimales pedida', () => {
    expect(kmToString(21.0975, 0)).toBe('21 km');
    expect(kmToString(21.0975, 4)).toBe('21.0975 km');
  });
});

describe('secondsToHMS', () => {
  it('con una hora o más muestra horas y minutos, sin segundos', () => {
    expect(secondsToHMS(3661)).toBe('1h 01m');
    expect(secondsToHMS(7200)).toBe('2h 00m');
  });

  it('por debajo de la hora muestra minutos y segundos', () => {
    expect(secondsToHMS(125)).toBe('2m 05s');
    expect(secondsToHMS(59)).toBe('0m 59s');
    expect(secondsToHMS(0)).toBe('0m 00s');
  });
});

describe('secondsToHours', () => {
  it('no redondea', () => {
    expect(secondsToHours(5400)).toBe(1.5);
  });
});

describe('formatDistance', () => {
  it('encadena metros a km con un decimal', () => {
    expect(formatDistance(5000)).toBe('5.0 km');
    expect(formatDistance(42195)).toBe('42.2 km');
  });
});

describe('formatElevation', () => {
  it('redondea a metros enteros', () => {
    expect(formatElevation(1234.6)).toBe('1235 m');
    expect(formatElevation(0)).toBe('0 m');
  });
});
