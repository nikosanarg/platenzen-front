import styled from 'styled-components';

export const Root = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const Card = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  @media (max-width: 600px) {
    padding: 1.25rem 1rem;
  }
`;

export const ActivityHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`;

export const ActivityName = styled.h3`
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
`;

export const ActivityDate = styled.div`
  font-size: 0.75rem;
  color: var(--text-muted);
  white-space: nowrap;
`;

export const StatsRow = styled.div`
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
`;

export const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

export const StatValue = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
`;

export const StatLabel = styled.div`
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
`;

export const MapContainer = styled.div`
  flex: 0 0 auto;
  width: 180px;
  aspect-ratio: 1 / 1;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 600px) {
    width: 100%;
    aspect-ratio: 1 / 1;
  }
`;

export const MapSvg = styled.svg`
  width: 100%;
  height: 100%;
`;

export const TopRow = styled.div`
  display: flex;
  gap: 1rem;
  align-items: flex-start;

  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

export const TopRowData = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const MapNoData = styled.div`
  font-size: 0.72rem;
  color: var(--text-muted);
`;

export const Divider = styled.div`
  height: 1px;
  background: var(--border);
`;

export const XPSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const XPHeadRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

export const XPBig = styled.div`
  font-size: 1.25rem;
  font-weight: 800;
  color: #f5c518;
`;

export const XPDetails = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
`;

export const XPChip = styled.div`
  font-size: 0.72rem;
  color: var(--text-muted);
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0.2rem 0.5rem;
`;

export const DNAImpactRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  align-items: center;
`;

export const DNALabel = styled.div`
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  margin-right: 0.25rem;
`;

export const DNAChip = styled.div<{ $positive: boolean }>`
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  border: 1px solid ${({ $positive }) => $positive ? 'rgba(74, 222, 128, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
  background: ${({ $positive }) => $positive ? 'rgba(74, 222, 128, 0.06)' : 'rgba(239, 68, 68, 0.06)'};
  color: ${({ $positive }) => $positive ? '#4ade80' : '#ef4444'};
`;

export const LevelUpBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--accent);
  background: var(--accent-muted);
  border: 1px solid rgba(252, 76, 2, 0.3);
  border-radius: 6px;
  padding: 0.35rem 0.75rem;
`;

export const ComparisonRow = styled.div<{ $positive: boolean }>`
  font-size: 0.8rem;
  color: ${({ $positive }) => $positive ? '#4ade80' : 'var(--text-muted)'};
  display: flex;
  align-items: center;
  gap: 0.375rem;
`;

export const AchievementList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
`;

export const AchievementChip = styled.div`
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.2rem 0.625rem;
  border-radius: 4px;
  border: 1px solid rgba(245, 197, 24, 0.4);
  background: rgba(245, 197, 24, 0.08);
  color: #f5c518;
`;

export const StravaLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.78rem;
  font-weight: 500;
  color: #fc4c02;
  border: 1px solid rgba(252, 76, 2, 0.3);
  border-radius: 6px;
  padding: 0.35rem 0.75rem;
  transition: background 0.15s;
  text-decoration: none;
  align-self: flex-start;

  &:hover {
    background: rgba(252, 76, 2, 0.1);
  }
`;

export const SectionSubtitle = styled.div`
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
`;
