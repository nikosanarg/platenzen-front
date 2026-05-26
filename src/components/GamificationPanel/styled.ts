import styled from 'styled-components';

export const PanelRoot = styled.section``;

export const SubSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const SubSectionTitle = styled.h3`
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
`;

export const MedalleroGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const MedalleroCard = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--accent);
  border-radius: var(--radius);
  padding: 1.125rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
  position: relative;
  overflow: hidden;
  cursor: default;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--accent);
    opacity: 0.06;
    pointer-events: none;
  }
`;

export const MedalleroCode = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #fff;
`;

export const MedalleroPermission = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
`;

export const MedalleroMission = styled.div`
  font-size: 0.68rem;
  color: var(--text-muted);
`;

export const MedalleroCheck = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  color: var(--accent);
`;

export const MissionsStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
`;

export const MissionItem = styled.div<{ $featured?: boolean }>`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: ${({ $featured }) => ($featured ? '1.25rem 1.375rem' : '1rem 1.125rem')};
  display: flex;
  flex-direction: column;
  gap: ${({ $featured }) => ($featured ? '0.75rem' : '0.5rem')};
`;

export const MissionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.875rem;
`;

export const MissionCodeBadge = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1.5px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  flex-shrink: 0;
`;

export const MissionInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

export const MissionTitle = styled.div<{ $featured?: boolean }>`
  font-size: ${({ $featured }) => ($featured ? '0.9rem' : '0.8rem')};
  font-weight: 600;
  color: var(--text-primary);
`;

export const MissionDescription = styled.div`
  font-size: 0.73rem;
  color: var(--text-muted);
  margin-top: 0.1rem;
`;

export const MissionReward = styled.div`
  font-size: 0.7rem;
  color: var(--text-secondary);
`;

export const ProgressRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
`;

export const ProgressTrack = styled.div`
  flex: 1;
  height: 4px;
  background: var(--border);
  border-radius: 999px;
  overflow: hidden;
`;

export const ProgressFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => ($pct * 100).toFixed(1)}%;
  background: var(--accent);
  border-radius: 999px;
  transition: width 0.6s ease;
`;

export const ProgressLabel = styled.div`
  font-size: 0.7rem;
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
`;

export const EmptyUnlocked = styled.div`
  font-size: 0.875rem;
  color: var(--text-muted);
  padding: 1rem 0;
`;

export const CollectionCount = styled.div`
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
`;
