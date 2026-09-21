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
 * **Íconos.** Hasta acá el manifiesto declaraba un único `platenzen_logo.png`
 * de 412×411 con fondo transparente, y eso producía tres defectos a la vez:
 *
 * 1. Con un solo tamaño no estándar, el navegador estira esa imagen para
 *    cualquier ranura que necesite — en un Android de densidad 3x el ícono del
 *    launcher se pide a ~576px. De ahí el pixelado.
 * 2. Sin variante `maskable`, Android recorta el rombo dentro de su máscara
 *    circular y se come las cuatro puntas.
 * 3. Sin `apple-touch-icon`, iOS cae a escalar el favicon de 32px, que es la
 *    peor versión de todas.
 *
 * Los cuatro archivos de `public/` se generaron desde el mismo logo **sin
 * agrandarlo**: el rombo entra a tamaño nativo (408px) dentro de la zona segura
 * del 80% de un lienzo de 512, así que no hay reescalado hacia arriba en
 * ninguno. Es el techo de nitidez que permite la fuente actual; para ir más
 * arriba haría falta el logo en vectorial.
 *
 * El fondo es `#606078` (`--text-muted`) y no `--bg-primary`: la marca es un
 * rombo mitad blanco y mitad negro, así que sobre el negro de la app desaparece
 * la mitad negra y sobre un fondo claro desaparece la blanca. `--text-muted` es
 * el único tono del sistema que contrasta con las dos.
 */
export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    // Fija la identidad de la app: sin `id`, el navegador la deriva de
    // `start_url` y cambiar esa ruta mañana instalaría una app distinta.
    id: '/',
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
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
