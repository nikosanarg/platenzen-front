/**
 * Modo mock para desarrollo local: entra al dashboard sin pasar por el OAuth de
 * Strava y con las actividades de `src/__mocks__/activitiesMock.ts`.
 *
 * Existe porque Strava sólo acepta el callback en el dominio registrado de la
 * app, así que desde `localhost` el login no vuelve nunca y no hay forma de ver
 * el dashboard. Es la misma idea que `NEXT_PUBLIC_ADMIN_AUTH_MODE=mock` de
 * valle-verde, con una diferencia de fondo: allá el mock inventa sólo la sesión
 * y los datos siguen saliendo de la API real. Acá no hay backend propio —los
 * datos son los de Strava—, así que sin sesión real tampoco hay datos reales, y
 * el mock tiene que poner las dos cosas.
 *
 * **Nunca vale en producción, aunque la variable esté seteada.** Un
 * `NEXT_PUBLIC_*` se hornea en el bundle en el build: si alguien lo deja
 * prendido en Vercel, la app le mostraría a cualquiera el historial de otra
 * persona como si fuera el suyo, y eso rompe la regla 1 del repo.
 *
 * Esta guarda apaga el modo, pero **no** saca la fixture del bundle: para eso
 * el chequeo de `NODE_ENV` tiene que estar inline junto al `import()` (ver
 * `useActivities`), donde el bundler lo puede plegar.
 */
export function isStravaMockMode(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return (process.env.NEXT_PUBLIC_STRAVA_AUTH_MODE || '').toLowerCase() === 'mock';
}
