/**
 * El ranking del club: la ventana de 90 días, la liga que sale de la racha y
 * el orden de la tabla. Es lo que decide en qué puesto queda cada corredor,
 * así que un borde corrido en un día o en una semana es una posición mentida.
 */
import {
  RankingEntry,
  actividadesEnVentana,
  enVentana,
  ligaPorRacha,
  resumenRunning,
  sortRanking,
} from '@/lib/ranking';
import { activity } from '@/__tests__/helpers/activity';
import { Activity } from '@/types/activity';

// Miércoles 15 de julio de 2026, hora local.
const NOW = new Date(2026, 6, 15, 12, 0, 0);

const at = (dia: string, over: Partial<Activity> = {}) =>
  activity({ start_date_local: `${dia}T07:00:00Z`, ...over });

const entry = (over: Partial<RankingEntry> & { id: string }): RankingEntry => ({
  nombre: over.id,
  rachaSemanas: 0,
  liga: 'bronce',
  distanciaKm: 0,
  actividades: 0,
  ritmoSegKm: null,
  ...over,
});

describe('ligaPorRacha', () => {
  it('bronce por debajo de 4 semanas seguidas', () => {
    expect(ligaPorRacha(0)).toBe('bronce');
    expect(ligaPorRacha(3)).toBe('bronce');
  });

  it('plata desde 4 y hasta 11 semanas', () => {
    expect(ligaPorRacha(4)).toBe('plata');
    expect(ligaPorRacha(11)).toBe('plata');
  });

  it('oro desde 12 semanas', () => {
    expect(ligaPorRacha(12)).toBe('oro');
    expect(ligaPorRacha(40)).toBe('oro');
  });
});

describe('ventana de 90 días', () => {
  it('incluye hoy y el día 90 hacia atrás, y deja afuera el 91', () => {
    // 15/07 menos 89 días = 17/04.
    expect(enVentana('2026-07-15', NOW)).toBe(true);
    expect(enVentana('2026-04-17', NOW)).toBe(true);
    expect(enVentana('2026-04-16', NOW)).toBe(false);
  });

  it('no cuenta días futuros', () => {
    expect(enVentana('2026-07-16', NOW)).toBe(false);
  });

  it('filtra actividades por su día local, no por el instante UTC', () => {
    // 23:30 del 16/04 en Buenos Aires es 02:30Z del 17/04: el día que cuenta es el local.
    const tarde = at('2026-04-16', {
      start_date: '2026-04-17T02:30:00Z',
      start_date_local: '2026-04-16T23:30:00Z',
    });
    expect(actividadesEnVentana([tarde], NOW)).toHaveLength(0);
  });
});

describe('resumenRunning', () => {
  it('suma sólo running: una bici no entra a distancia ni a salidas', () => {
    const r = resumenRunning([
      at('2026-07-10', { id: 1, distance: 10000 }),
      at('2026-07-11', { id: 2, distance: 40000, sport_type: 'Ride', type: 'Ride' }),
    ]);
    expect(r.distanciaKm).toBe(10);
    expect(r.actividades).toBe(1);
  });

  it('el ritmo es tiempo total sobre distancia total, no el promedio de ritmos', () => {
    // 3 km a 4:00 (720 s) y 21 km a 6:00 (7560 s): 8280 s / 24 km = 345 s/km.
    // El promedio simple de los dos ritmos daría 300 s/km.
    const r = resumenRunning([
      at('2026-07-10', { id: 1, distance: 3000, moving_time: 720 }),
      at('2026-07-12', { id: 2, distance: 21000, moving_time: 7560 }),
    ]);
    expect(r.ritmoSegKm).toBeCloseTo(345);
  });

  it('sin salidas con ritmo medido, el ritmo es null y no cero', () => {
    const r = resumenRunning([at('2026-07-10', { distance: 0, moving_time: 1800, average_speed: 0 })]);
    expect(r.ritmoSegKm).toBeNull();
    expect(r.actividades).toBe(1);
  });
});

describe('sortRanking', () => {
  const a = entry({ id: 'a', distanciaKm: 100, actividades: 10, ritmoSegKm: 330 });
  const b = entry({ id: 'b', distanciaKm: 150, actividades: 8, ritmoSegKm: 300 });
  const c = entry({ id: 'c', distanciaKm: 80, actividades: 20, ritmoSegKm: null });

  const ids = (es: RankingEntry[]) => es.map(e => e.id);

  it('por distancia, de más a menos km', () => {
    expect(ids(sortRanking([a, b, c], 'distancia'))).toEqual(['b', 'a', 'c']);
  });

  it('por actividades, de más a menos salidas', () => {
    expect(ids(sortRanking([a, b, c], 'actividades'))).toEqual(['c', 'a', 'b']);
  });

  it('por ritmo, el más rápido primero y sin ritmo al final', () => {
    expect(ids(sortRanking([c, a, b], 'ritmo'))).toEqual(['b', 'a', 'c']);
  });

  it('un empate se resuelve por distancia', () => {
    const d = entry({ id: 'd', distanciaKm: 200, actividades: 10, ritmoSegKm: 330 });
    expect(ids(sortRanking([a, d], 'actividades'))).toEqual(['d', 'a']);
    expect(ids(sortRanking([a, d], 'ritmo'))).toEqual(['d', 'a']);
  });

  it('no muta el arreglo recibido', () => {
    const entrada = [a, b, c];
    sortRanking(entrada, 'distancia');
    expect(ids(entrada)).toEqual(['a', 'b', 'c']);
  });
});
