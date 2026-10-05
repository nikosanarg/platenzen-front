import PaginaPublica from '@/components/PaginaPublica';
import FichaPublica from '@/components/FichaPublica';

export const metadata = { title: 'Ficha de corredor — Platenzen' };

/**
 * Fuera del grupo `(app)`: es el link que un corredor comparte, y quien lo
 * abre no tiene por qué tener Strava conectado.
 */
export default async function HeroPublicoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PaginaPublica>
      <FichaPublica id={id} />
    </PaginaPublica>
  );
}
