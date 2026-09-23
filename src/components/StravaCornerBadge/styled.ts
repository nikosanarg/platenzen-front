import styled from 'styled-components';

/**
 * Mismo recurso que `RibbonBanner` de `CoachAnalisis` (franja diagonal que
 * cruza una esquina, recortada por `overflow: hidden` del contenedor), en la
 * esquina superior derecha y a escala de card de sidebar en vez de logo con
 * texto: fondo blanco, sólo el isotipo de Strava.
 */
export const StravaRibbon = styled.div`
  position: absolute;
  top: 9px;
  right: -15px;
  width: 46px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(45deg);
  transform-origin: center;
  z-index: 2;
  background: #fff;
  box-shadow: var(--shadow-sm);
  pointer-events: none;
`;
