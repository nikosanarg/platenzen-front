import styled from 'styled-components';

/**
 * `900px` es el mismo corte que ya usa el resto del producto para escritorio
 * vs. teléfono. Las dos vistas se montan juntas y CSS decide cuál se ve —así
 * el tab activo no se pierde al cruzar el breakpoint con la ventana— y sólo
 * una paga el costo de layout en cada momento.
 */
export const DesktopOnly = styled.div`
  display: contents;

  @media (max-width: 900px) {
    display: none;
  }
`;

export const MobileOnly = styled.div`
  display: none;

  @media (max-width: 900px) {
    display: block;
  }
`;
