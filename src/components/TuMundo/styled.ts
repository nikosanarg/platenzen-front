import styled from 'styled-components';
import { Panel } from '@/components/Panel';

export const Root = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

export const HeatmapContainer = styled(Panel)`
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

export const DetailPanel = styled(Panel)`
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

export const EmptyState = styled(Panel)`
  padding: 3rem 2rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.875rem;
`;

export const ZoomControls = styled.div`
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const ZoomButton = styled.button`
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: var(--accent);
    color: var(--accent);
  }

  &:disabled {
    opacity: 0.35;
    cursor: default;
  }
`;

export const MapHint = styled.p`
  font-size: 0.72rem;
  color: var(--text-muted);
  line-height: 1.4;
  margin-top: -0.35rem;
`;
