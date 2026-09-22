'use client';

import Image from 'next/image';
import { Layer, Scrim } from './styled';

/**
 * El fondo de toda la app: una sola instancia, montada en el layout raíz, así
 * vive detrás de las cuatro tabs y de la pantalla de conexión sin volver a
 * pedirse al navegar entre rutas.
 *
 * `loading="lazy"` a propósito, aunque sea la primera imagen de la pantalla:
 * es decorativo, no contenido — que compita por ancho de banda con el token,
 * el historial de Strava o el bundle no vale la pena. Un fotograma con el
 * fondo sólido de siempre y nada más se nota, mentir con `priority` no.
 */
const AppBackground: React.FC = () => (
  <Layer aria-hidden="true">
    <Image
      src="/assets/platenzen-background.jpg"
      alt=""
      fill
      sizes="100vw"
      loading="lazy"
      style={{ objectFit: 'cover' }}
    />
    <Scrim />
  </Layer>
);

export default AppBackground;
