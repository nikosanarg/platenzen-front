/**
 * `Activity.start_date_local` trae un sufijo "Z", pero **no** es UTC: es la
 * hora de pared del lugar donde corriste. `new Date(iso)` la parsea como si
 * fuera UTC de verdad, y de ahí en más cualquier getter local (`getHours`,
 * `getDate`, `getDay`...) le suma el offset del huso horario del servidor
 * encima de un valor que ya era local — una actividad a las 11:12 en
 * Argentina (UTC-3) se mostraba como las 08:12 en un runtime en UTC-3,
 * porque el offset se aplicaba dos veces.
 *
 * Esta función arma el `Date` con el constructor local a partir de los
 * números escritos en el string, no parseando la fecha como instante: así,
 * los getters locales de esta misma sesión devuelven exactamente esos
 * números, sin importar en qué huso corra el proceso.
 */
export function parseLocalDate(iso: string): Date {
  const [datePart, timePart = '00:00:00'] = iso.replace('Z', '').split('T');
  const [y, mo, d] = datePart.split('-').map(Number);
  const [h, mi, s] = timePart.split(':').map(Number);
  return new Date(y, mo - 1, d, h, mi, Math.trunc(s || 0));
}
