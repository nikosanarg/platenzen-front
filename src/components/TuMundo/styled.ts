import styled from 'styled-components';

export const Root = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

export const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 1rem;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

export const HeatmapContainer = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  position: relative;
`;

export const HeatmapSvg = styled.svg`
  display: block;
  width: 100%;
`;

export const Tooltip = styled.div<{ $visible: boolean }>`
  pointer-events: none;
  position: absolute;
  background: rgba(10, 10, 15, 0.92);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  color: var(--text-primary);
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.15s;
  white-space: nowrap;
  z-index: 10;
`;

export const ZoneList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 400px;
  overflow-y: auto;
`;

export const ZoneItem = styled.div<{ $active: boolean }>`
  background: ${props => props.$active ? 'rgba(252, 76, 2, 0.08)' : 'var(--bg-card)'};
  border: 1px solid ${props => props.$active ? 'rgba(252, 76, 2, 0.4)' : 'var(--border)'};
  border-radius: var(--radius-sm);
  padding: 0.625rem 0.875rem;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  &:hover {
    border-color: rgba(252, 76, 2, 0.3);
    background: rgba(252, 76, 2, 0.05);
  }
`;

export const ZoneRank = styled.div`
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  min-width: 1.25rem;
  text-align: right;
`;

export const ZoneInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

export const ZoneName = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const ZoneMeta = styled.div`
  font-size: 0.68rem;
  color: var(--text-muted);
  margin-top: 0.125rem;
`;

export const ZoneVisits = styled.div`
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--accent);
  white-space: nowrap;
`;

export const DetailPanel = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
`;

export const DetailTitle = styled.div`
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-primary);
`;

export const DetailStats = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.625rem;
`;

export const DetailStat = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
`;

export const DetailStatValue = styled.div`
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
`;

export const DetailStatLabel = styled.div`
  font-size: 0.62rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
`;

export const RecentActivities = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

export const ActivityRow = styled.div`
  font-size: 0.72rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &::before {
    content: '·';
    color: var(--text-muted);
    flex-shrink: 0;
  }
`;

export const EmptyState = styled.div`
  padding: 3rem 2rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.875rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
`;

export const SubTitle = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;
