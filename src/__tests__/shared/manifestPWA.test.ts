import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import manifest from '@/app/manifest';

/**
 * El defecto que motivó estos íconos no fue un error de código: el manifiesto
 * declaraba `sizes: '412x411'` y el archivo medía exactamente eso, así que
 * cualquier aserción sobre el manifiesto solo habría pasado. Lo que fallaba era
 * la relación entre las dos cosas — el navegador estiraba esa imagen para
 * llenar ranuras de 512 y más.
 *
 * Por eso el test no se cree lo que dice el manifiesto: abre cada PNG de
 * `public/` y le lee el ancho y el alto reales de la cabecera IHDR.
 */

const PUBLIC = join(process.cwd(), 'public');

/** Ancho y alto de un PNG, leídos del IHDR (bytes 16..23 del archivo). */
function medirPNG(ruta: string): { ancho: number; alto: number } {
  const buf = readFileSync(ruta);
  return { ancho: buf.readUInt32BE(16), alto: buf.readUInt32BE(20) };
}

describe('manifiesto de la PWA', () => {
  const m = manifest();

  it('fija la identidad de la app con `id`', () => {
    // Sin `id` la identidad se deriva de `start_url`: cambiar esa ruta haría
    // que el navegador instale una app distinta en vez de actualizar esta.
    expect(m.id).toBe('/');
  });

  it('cubre la app entera, no una sección', () => {
    expect(m.scope).toBe('/');
    expect(m.start_url).toBe('/');
    expect(m.display).toBe('standalone');
  });

  it('arranca sin fogonazo blanco', () => {
    // `--bg-primary` de globals.css. Un splash claro en una app oscura se ve
    // como un destello en cada arranque.
    expect(m.background_color).toBe('#0d0d0f');
    expect(m.theme_color).toBe('#0d0d0f');
  });

  it('declara 192, 512 y una variante maskable', () => {
    const iconos = m.icons ?? [];
    expect(iconos.map((i) => i.sizes)).toEqual(
      expect.arrayContaining(['192x192', '512x512']),
    );
    // Sin `maskable`, Android recorta la marca dentro de su máscara circular.
    expect(iconos.filter((i) => i.purpose === 'maskable')).toHaveLength(1);
  });

  it.each((manifest().icons ?? []).map((i) => [i.src, i.sizes] as const))(
    'el archivo %s existe y mide de verdad %s',
    (src, sizes) => {
      const ruta = join(PUBLIC, src!.replace(/^\//, ''));
      expect(existsSync(ruta)).toBe(true);

      const [ancho, alto] = sizes!.split('x').map(Number);
      expect(medirPNG(ruta)).toEqual({ ancho, alto });
    },
  );

  it('el apple-touch-icon existe y mide 180x180', () => {
    // iOS ignora los íconos del manifiesto: sin este archivo escala el favicon
    // de 32px, que era el peor de los tres defectos.
    const ruta = join(PUBLIC, 'apple-touch-icon.png');
    expect(existsSync(ruta)).toBe(true);
    expect(medirPNG(ruta)).toEqual({ ancho: 180, alto: 180 });
  });
});
