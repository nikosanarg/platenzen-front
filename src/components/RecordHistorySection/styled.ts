import styled from 'styled-components';

export const HistoryRoot = styled.section``;

/** Una lista, no una grilla: vive en la sidebar de "cómo viene mi historia". */
export const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

/**
 * Va como `leftVisual` de `StatCard` (que ya define tamaño y peso ahí) o
 * suelto dentro de `NoRecord`, que no pasa por `StatCard` — por eso repite
 * el tamaño acá en vez de heredarlo siempre.
 */
export const DistanceLabel = styled.span`
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
`;

/** Nombre de la actividad como primera row: verde, distinto del naranja del label de distancia. */
export const ActivityName = styled.span`
  color: var(--positive);
`;

export const ImprovementText = styled.span`
  font-family: var(--font-num);
  color: var(--positive);
  font-weight: 600;
`;

export const NoRecord = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.78rem;
  color: var(--text-muted);
  font-style: italic;
  background: var(--bg-card);
  border-radius: var(--radius);
  padding: 0.55rem 0.85rem;
  box-shadow: var(--shadow-sm);
`;
