/**
 * Descripción del corredor. Es texto que el usuario lee sobre sí mismo, así que
 * lo que se verifica es que respete el tono factual del producto: describe lo que
 * hace, sin arengas ni signos de exclamación.
 */
import { buildPersonaDescription } from '@/lib/runnerPersona';
import { BranchResult } from '@/lib/roles';
import { computeStats } from '@/lib/stats';
import { activity } from '@/__tests__/helpers/activity';

const branch = (roleId: string): BranchResult => ({
  branch: 'distance',
  currentRole: { id: roleId, name: 'Rol', branch: 'distance', level: 1 },
  nextRole: null,
  afinidad: 50,
  whyCurrentRole: '',
  howToProgress: null,
});

/** Stats con todas las salidas un mismo día de la semana. */
const statsOnWeekday = (date: string) =>
  computeStats([activity({ start_date_local: `${date}T12:00:00Z` })]);

describe('buildPersonaDescription', () => {
  it('arranca con la identidad del rol', () => {
    const texto = buildPersonaDescription(branch('maratonista'), statsOnWeekday('2026-07-15'), 80);
    expect(texto).toContain('Maratonista consagrado');
  });

  it('cae al nombre del rol si el id no tiene identidad definida', () => {
    const texto = buildPersonaDescription(branch('rol-inexistente'), statsOnWeekday('2026-07-15'), 80);
    expect(texto).toContain('Rol');
  });

  it('nombra el día de la semana dominante, en plural', () => {
    // 2026-07-15 es miércoles.
    const texto = buildPersonaDescription(branch('fondista'), statsOnWeekday('2026-07-15'), 80);
    expect(texto).toContain('miércoless');
  });

  it('con salidas en varios días, elige el de más actividades como dominante', () => {
    const stats = computeStats([
      activity({ id: 1, start_date_local: '2026-07-13T12:00:00Z' }), // lunes
      activity({ id: 2, start_date_local: '2026-07-13T13:00:00Z' }), // lunes
      activity({ id: 3, start_date_local: '2026-07-14T12:00:00Z' }), // martes
    ]);
    const texto = buildPersonaDescription(branch('fondista'), stats, 80);

    expect(texto).toContain('luness');
    expect(texto).not.toContain('martess');
  });

  it('omite el día si no hay ninguna salida', () => {
    const texto = buildPersonaDescription(branch('amateur'), computeStats([]), 20);
    expect(texto).not.toContain('corre principalmente');
  });

  it('describe la constancia según el umbral alcanzado', () => {
    const stats = statsOnWeekday('2026-07-15');

    expect(buildPersonaDescription(branch('fondista'), stats, 80)).toContain('progresión constante');
    expect(buildPersonaDescription(branch('fondista'), stats, 50)).toContain('forma sostenida');
    expect(buildPersonaDescription(branch('fondista'), stats, 20)).toContain('de a poco');
  });

  it('usa los bordes exactos de los umbrales 70 y 45', () => {
    const stats = statsOnWeekday('2026-07-15');

    expect(buildPersonaDescription(branch('fondista'), stats, 70)).toContain('progresión constante');
    expect(buildPersonaDescription(branch('fondista'), stats, 69)).toContain('forma sostenida');
    expect(buildPersonaDescription(branch('fondista'), stats, 45)).toContain('forma sostenida');
    expect(buildPersonaDescription(branch('fondista'), stats, 44)).toContain('de a poco');
  });

  it('capitaliza la oración de comportamiento', () => {
    const texto = buildPersonaDescription(branch('fondista'), statsOnWeekday('2026-07-15'), 80);
    const segundaOracion = texto.split('. ')[1];

    expect(segundaOracion[0]).toBe(segundaOracion[0].toUpperCase());
  });

  it('mantiene el tono factual: sin signos de exclamación', () => {
    const texto = buildPersonaDescription(branch('velocista'), statsOnWeekday('2026-07-15'), 90);
    expect(texto).not.toMatch(/[!¡]/);
  });

  it('cierra con punto', () => {
    const texto = buildPersonaDescription(branch('velocista'), statsOnWeekday('2026-07-15'), 90);
    expect(texto.endsWith('.')).toBe(true);
  });
});
