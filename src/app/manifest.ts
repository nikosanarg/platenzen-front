import type { MetadataRoute } from 'next';

/**
 * Manifiesto de la PWA (frente D). Next lo sirve en `/manifest.webmanifest`
 * desde esta ruta de metadata — no hay archivo en `public/`. Forma tomada de
 * `valle-verde/app/manifest.ts`.
 *
 * `scope: '/'` acá y no `/admin` como en Valle Verde: allá la PWA era sólo el
 * panel interno de un sitio que también tiene parte pública, acá la app ES el
 * sitio entero.
 *
 * `background_color`/`theme_color` en `#0d0d0f` (`--bg-primary` de
 * `globals.css`): Platenzen es una app oscura, un splash blanco produciría un
 * fogonazo en cada arranque. Deliberadamente NO se usa `--accent` (`#fc4c02`):
 * ese es el naranja de Strava, y esta app está dejando de ser sólo de Strava
 * (ver Frente C, soporte Garmin).
 *
 * Ícono: el único cuadrado disponible hoy es `platenzen_logo.png` (412×411),
 * declarado `purpose: 'any'`. Alcanza para que Chrome considere la app
 * instalable (pide 192 o más) pero falta un juego propio 192/512 con variante
 * `maskable` — sin él, Android recorta el logo dentro de su máscara circular.
 * No se genera acá: necesita un asset de diseño, no código (ver
 * docs/feedback-frente-d.md, misma deuda que Valle Verde con `logo2.png`).
 */
export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Platenzen — Estadísticas de running',
    short_name: 'Platenzen',
    description:
      'Dashboard personal de estadísticas de Strava: nivel y XP, logros, predicciones, récords proyectados y mapa de actividad anual.',
    lang: 'es',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0d0d0f',
    theme_color: '#0d0d0f',
    icons: [
      {
        src: '/assets/platenzen_logo.png',
        sizes: '412x411',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
