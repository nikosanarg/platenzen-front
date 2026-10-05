import styled, { css } from 'styled-components';
import { Panel } from '@/components/Panel';

/**
 * El layout se decide por el ancho del contenedor, no del viewport: la misma
 * ficha vive en una página a lo ancho y en un modal de 760px, y tiene que
 * pasar a una columna en el modal aunque la pantalla sea ancha.
 */
const layout = css`
  --board-max: 300px;

  /* Con contención de tamaño el ancho ya no sale del contenido: sin el 100%
     la ficha colapsa a nada adentro de un contenedor que centra. */
  container-type: inline-size;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-width: 0;
`;

export const CardRoot = styled(Panel)`
  ${layout}
  padding: 1.75rem 2rem;

  @media (max-width: 600px) {
    padding: 1.5rem 1.25rem;
  }
`;

export const PlainRoot = styled.div`
  ${layout}
`;

export const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const Nombre = styled.p`
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
`;

export const Publicada = styled.p`
  font-size: 0.75rem;
  color: var(--text-muted);
`;

export const Badges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

export const Body = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
  gap: 1.75rem;
  align-items: start;

  @container (max-width: 640px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const RadarCol = styled.div`
  min-width: 0;
`;

export const DataCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-width: 0;
`;

/** Dos columnas fijas: seis números en pares (total / reciente) se leen mejor que un auto-fit que los desparrama. */
export const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem 1rem;
`;

export const Block = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-width: 0;
`;

export const BlockHead = styled.h3`
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
`;

/** 13 semanas a todo el ancho darían celdas enormes: se acota como un trimestre de calendario. */
export const HeatmapWrap = styled.div`
  max-width: 360px;
`;
