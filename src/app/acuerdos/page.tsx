import PaginaPublica from '@/components/PaginaPublica';
import Acuerdos from '@/components/Acuerdos';

export const metadata = { title: 'Acuerdos del club — Platenzen' };

/** Fuera del grupo `(app)`: se tiene que poder leer antes de conectar nada. */
export default function AcuerdosPage() {
  return (
    <PaginaPublica>
      <Acuerdos />
    </PaginaPublica>
  );
}
