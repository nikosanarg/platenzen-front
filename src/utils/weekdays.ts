/**
 * El día de la semana en plural ("los lunes", "los sábados"), indexado como
 * `Date.getDay()`. De lunes a viernes el plural no cambia; sábado y domingo
 * suman una s. Estaba escrito dos veces como "nombre + s", que da "luneses".
 */
const PLURAL = ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'];

export function diaEnPlural(day: number): string {
  return PLURAL[day];
}
