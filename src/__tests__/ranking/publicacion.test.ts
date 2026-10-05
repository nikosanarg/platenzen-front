/**
 * Lo que sale del dispositivo hacia el club. Se fija lo que la promesa de
 * privacidad dice que pasa: sólo números derivados, sin los nombres que el
 * corredor les puso a sus salidas, y con los mismos criterios que el ranking.
 */
import { construirPublicacion, diasRunning, semanasActivas } from '@/lib/club/publicacion';
import { computeStats } from '@/lib/stats';
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
  activity({ id, name: `Vuelta por mi casa ${id}`, start_date_local: `${dia}T07:00:00Z`, ...over });

describe('diasRunning', () => {
  it('suma el running por día local, sólo dentro de la ventana', () => {
    const dias = diasRunning(
      [
        at(1, '2026-07-10', { distance: 10000, moving_time: 3000 }),
        at(2, '2026-07-10', { distance: 5000, moving_time: 1500 }),
        at(3, '2026-07-11', { distance: 40000, sport_type: 'Ride', type: 'Ride' }),
        at(4, '2026-04-16', { distance: 8000 }),
      ],
      NOW
    );
    expect(dias).toEqual([{ dia: '2026-07-10', km: 15, salidas: 2, kmConRitmo: 15, segConRitmo: 4500 }]);
  });

  it('una salida sin ritmo medido suma km pero no entra al ritmo', () => {
    const [dia] = diasRunning([at(1, '2026-07-10', { distance: 5000, moving_time: 1800, average_speed: 0 })], NOW);
    expect(dia).toMatchObject({ km: 5, salidas: 1, kmConRitmo: 0, segConRitmo: 0 });
  });
});

describe('semanasActivas', () => {
  it('son los lunes de las semanas con cualquier actividad', () => {
    const acts = [
      at(1, '2026-07-15'),
      at(2, '2026-07-13'),
      at(3, '2026-07-02', { sport_type: 'Ride', type: 'Ride' }),
    ];
    expect(semanasActivas(computeStats(acts), NOW)).toEqual(['2026-06-29', '2026-07-13']);
  });

  it('un domingo es de la semana que arrancó el lunes anterior', () => {
    expect(semanasActivas(computeStats([at(1, '2026-07-12')]), NOW)).toEqual(['2026-07-06']);
  });
});

describe('construirPublicacion', () => {
  it('la ficha no lleva los nombres de las salidas ni un nombre de persona', () => {
    const acts = [
      at(1, '2026-07-10'),
      at(2, '2026-07-11', { sport_type: 'TrailRun', type: 'Run' }),
      at(3, '2026-07-12', { sport_type: 'Ride', type: 'Ride' }),
    ];
    const { ficha } = construirPublicacion(acts, computeStats(acts), NOW);
    expect(ficha.nombre).toBeNull();
    expect(ficha.destacadas.recientes.map(a => a.nombre)).toEqual(['Otra actividad', 'Trail', 'Carrera']);
    expect(JSON.stringify(ficha)).not.toContain('Vuelta por mi casa');
  });

  it('entra holgada en el tope de tamaño de la API (64 KB)', () => {
    const acts = Array.from({ length: 400 }, (_, i) => {
      const d = new Date(2026, 6, 15 - (i % 365));
      const dia = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return at(i + 1, dia);
    });
    const p = construirPublicacion(acts, computeStats(acts), NOW);
    expect(Buffer.byteLength(JSON.stringify(p.ficha))).toBeLessThan(64 * 1024);
  });
});
