/**
 * La ficha pública: lo que un tercero ve de un corredor. Se verifica que salga
 * de los mismos cálculos que las vistas privadas, recortada a lo que tiene
 * sentido publicar.
 */
import { buildHeroProfile, rankingEntryDe } from '@/lib/heroProfile';
import { computeStats } from '@/lib/stats';
import { localDateKey } from '@/utils/localDate';
import { activity } from '@/__tests__/helpers/activity';
import { Activity } from '@/types/activity';

// Miércoles 15 de julio de 2026, hora local.
const NOW = new Date(2026, 6, 15, 12, 0, 0);

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});

afterEach(() => {
  jest.useRealTimers();
});

const at = (id: number, dia: string, over: Partial<Activity> = {}) =>
  activity({
    id,
    name: `Salida ${id}`,
    start_date: `${dia}T10:00:00Z`,
    start_date_local: `${dia}T07:00:00Z`,
    ...over,
  });

/** Una salida por semana durante `semanas` semanas, la última el lunes de esta. */
function semanal(semanas: number): Activity[] {
  return Array.from({ length: semanas }, (_, i) => at(i + 1, localDateKey(new Date(2026, 6, 13 - i * 7))));
}

function ficha(activities: Activity[]) {
  return buildHeroProfile(activities, computeStats(activities), NOW);
}

describe('buildHeroProfile', () => {
  it('la liga sale de la racha semanal actual', () => {
    expect(ficha(semanal(3)).liga).toBe('bronce');
    expect(ficha(semanal(4)).liga).toBe('plata');
    expect(ficha(semanal(12)).liga).toBe('oro');
  });

  it('cualquier deporte sostiene la racha', () => {
    const conBici = [...semanal(3), at(99, '2026-06-24', { sport_type: 'Ride', type: 'Ride' })];
    expect(ficha(conBici).totales.rachaSemanas).toBe(4);
  });

  it('"más rápidas" mira sólo running, aunque una bici vaya más rápido', () => {
    const p = ficha([
      at(1, '2026-07-10', { distance: 10000, moving_time: 3000 }),
      at(2, '2026-07-11', { distance: 40000, moving_time: 4800, sport_type: 'Ride', type: 'Ride' }),
    ]);
    expect(p.destacadas.rapidas.map(a => a.nombre)).toEqual(['Salida 1']);
    expect(p.destacadas.largas[0].nombre).toBe('Salida 2');
  });

  it('cada lista destacada trae como mucho tres', () => {
    const p = ficha(semanal(6));
    expect(p.destacadas.recientes).toHaveLength(3);
    expect(p.destacadas.recientes[0].fecha).toBe('2026-07-13');
  });

  it('una actividad que no es running no muestra ritmo', () => {
    const p = ficha([at(1, '2026-07-10', { sport_type: 'Ride', type: 'Ride' })]);
    expect(p.destacadas.recientes[0].ritmoSegKm).toBeNull();
  });

  it('el mapa de calor y los números de 90 días usan la misma ventana', () => {
    const p = ficha([at(1, '2026-07-10'), at(2, '2026-04-17'), at(3, '2026-04-16')]);
    expect(p.dias90.map(d => d.date)).toEqual(['2026-04-17', '2026-07-10']);
    expect(p.ultimos90.actividades).toBe(2);
    expect(p.totales.actividades).toBe(3);
  });

  it('las frases hablan de un tercero', () => {
    const p = ficha([at(1, '2026-07-10', { distance: 22000, moving_time: 7200 })]);
    expect(p.frases).toContain('Ya alcanzó una distancia de media maratón o más (22 km)');
    expect(p.frases.join(' ')).not.toMatch(/\b(tu|tus|alcanzaste|llevás)\b/i);
  });

  it('sin historial no inventa nada', () => {
    const p = ficha([]);
    expect(p.mejorMarca).toBeNull();
    expect(p.ultimos90.ritmoSegKm).toBeNull();
    expect(p.frases).toEqual([]);
    expect(p.titulo).toBe('Corredor');
  });

  it('el nombre queda null si no se conoce', () => {
    expect(ficha([]).nombre).toBeNull();
  });
});

describe('rankingEntryDe', () => {
  it('copia los números de la ficha sin recalcular', () => {
    const p = ficha(semanal(5));
    expect(rankingEntryDe('yo', p)).toEqual({
      id: 'yo',
      nombre: null,
      rachaSemanas: 5,
      liga: 'plata',
      distanciaKm: p.ultimos90.distanciaKm,
      actividades: p.ultimos90.actividades,
      ritmoSegKm: p.ultimos90.ritmoSegKm,
    });
  });
});
