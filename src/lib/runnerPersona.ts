import { ProcessedStats } from '@/types/stats';
import { BranchResult } from '@/lib/roles';

const WEEKDAY_NAMES_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** Short identity clause per role (subject implicit). */
const ROLE_IDENTITY: Record<string, string> = {
  amateur: 'Corredor amateur construyendo su base de kilómetros',
  fondista: 'Corredor de fondo especializado en largas distancias',
  ultrafondista: 'Ultrafondista de alto volumen',
  maratonista: 'Maratonista consagrado',
  corredor: 'Corredor en busca de velocidad',
  pasadista: 'Pasadista que construye velocidad real',
  velocista: 'Velocista explosivo',
  explorador: 'Explorador de su entorno',
  trotamundos: 'Trotamundos que corre nuevos terrenos',
  conquistador: 'Conquistador de rutas y desniveles',
  competidor: 'Competidor constante',
  coleccionador: 'Coleccionista de logros',
  medallista: 'Medallista referente en logros de carrera',
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * A short human description of the runner, built from their primary role,
 * dominant training weekday and consistency level.
 */
export function buildPersonaDescription(
  primary: BranchResult,
  stats: ProcessedStats,
  consistencia: number
): string {
  const identity = ROLE_IDENTITY[primary.currentRole.id] ?? primary.currentRole.name;

  const behaviors: string[] = [];

  const topDay = [...stats.weekdayDistribution]
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count)[0];
  if (topDay) {
    behaviors.push(`corre principalmente los ${WEEKDAY_NAMES_ES[topDay.day]}s`);
  }

  behaviors.push(
    consistencia >= 70
      ? 'mantiene una progresión constante'
      : consistencia >= 45
      ? 'progresa de forma sostenida'
      : 'construye su constancia de a poco'
  );

  return `${identity}. ${capitalize(behaviors.join(' y '))}.`;
}
