import styled from 'styled-components';

export const HistoryRoot = styled.section``;

/** Una lista, no una grilla: vive en la sidebar de "cómo viene mi historia". */
export const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

/**
 * +6px sobre el resto de la card: es lo primero que se lee de la fila. El
 * borde blanco (`-webkit-text-stroke`) es lo que separa el naranja sólido
 * del fondo oscuro sin bajarle la saturación al relleno. Va como `title` de
 * `StatCard`, no como parte de su layout — es la única de las tres listas
 * que necesita este tratamiento puntual.
 */
export const DistanceLabel = styled.span`
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
  -webkit-text-stroke: 0.5px #fff;
`;

export const ImprovementText = styled.span`
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
  border-radius: var(--radius-sm);
  padding: 0.55rem 0.85rem;
  box-shadow: var(--shadow-sm);
`;
