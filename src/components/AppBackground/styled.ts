import styled from 'styled-components';

/**
 * Fijo detrás de todo, con `z-index: -1`: así la imagen queda debajo de
 * cualquier fondo opaco que la tape (header, cards) sin que nadie tenga que
 * acordarse de darle `position` a su propio contenido.
 */
export const Layer = styled.div`
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
`;

/**
 * Atenúa la foto en toda la app, no sólo en el centro — ese oscurecido extra
 * lo pone `DashboardContent` encima. Sin este piso, los márgenes fuera del
 * contenido (y la pantalla de conexión) quedan con la imagen a pleno
 * contraste, compitiendo con el texto.
 */
export const Scrim = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(6, 7, 10, 0.6);
`;
