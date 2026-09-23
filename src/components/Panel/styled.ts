import styled, { css } from 'styled-components';

/**
 * Shell reused by every top-level card/section in the app: dark surface, no
 * border — the background against the page is what reads as the edge, a
 * border on top of that was redundant.
 */
export const Panel = styled.div`
  background: var(--bg-card);
  border-radius: var(--radius);
`;

/**
 * Hover "vidrio esmerilado" de las filas de la sidebar (récords, sesiones
 * legendarias, lugares frecuentados): nace del hover que ya tenía "Lugares
 * más frecuentados" — fondo semitransparente en vez de sólido —, llevado al
 * mismo tratamiento que el botón flotante de tutipoker con blur detrás.
 * `tintRgb` es el canal `R, G, B` que tiñe cada lista (`var(--accent-rgb)`,
 * `var(--gold-rgb)`).
 */
export const glassHover = (tintRgb: string) => css`
  &:hover,
  &:active {
    background: rgba(${tintRgb}, 0.1);
    border-color: rgba(${tintRgb}, 0.4);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
`;
