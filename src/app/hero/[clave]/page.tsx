import PaginaPublica from '@/components/PaginaPublica';
import FichaPublica from '@/components/FichaPublica';

export const metadata = { title: 'Ficha de corredor — Platenzen' };

/**
 * Fuera del grupo `(app)`: es el link que un corredor comparte, y quien lo
 * abre no tiene por qué tener Strava conectado. `clave` es el @usuario del
 * corredor; su alias o su id también llevan a la misma ficha.
 */
export default async function HeroPublicoPage({ params }: { params: Promise<{ clave: string }> }) {
  const { clave } = await params;
  return (
    <PaginaPublica>
      <FichaPublica clave={decodeURIComponent(clave)} />
    </PaginaPublica>
  );
}
