import styled from 'styled-components';

export const TabsRoot = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
`;

export const TabBar = styled.div`
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: 0.75rem;
`;

export const TabBtn = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  border-bottom: 2px solid ${({ $active }) => ($active ? 'var(--accent)' : 'transparent')};
  padding: 0.5rem 0.875rem;
  font-size: 0.8rem;
  font-weight: ${({ $active }) => ($active ? '600' : '400')};
  color: ${({ $active }) => ($active ? 'var(--text-primary)' : 'var(--text-muted)')};
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  white-space: nowrap;
  margin-bottom: -1px;

  &:hover {
    color: var(--text-secondary);
  }
`;

/**
 * Alto fijo, no `flex: 1`: el `ChartCard` que lo contiene no tiene una altura
 * definida propia (crece con su contenido), así que un `flex: 1` ahí no
 * resuelve a nada — y sin un alto real en px, `ResponsiveContainer` de
 * Recharts no tiene de qué medir y el gráfico no aparece. El hijo directo
 * (el `ChartCard` del gráfico activo) se estira a ese alto para que, a su
 * vez, el `flex: 1` de `ChartArea` tenga algo real que llenar.
 */
export const TabPanel = styled.div`
  height: 260px;
  display: flex;
  flex-direction: column;

  > * {
    flex: 1;
    min-height: 0;
  }
`;
