import NotFound from '@/components/NotFound';

/**
 * Vive en la raíz, fuera del grupo `(app)`: una URL que no existe no tiene por
 * qué pedir la sesión de Strava ni procesar el historial para decir que no
 * existe.
 */
export default function NotFoundPage() {
  return <NotFound />;
}
