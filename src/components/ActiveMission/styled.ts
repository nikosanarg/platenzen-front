import styled from 'styled-components';

export const MissionCard = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 2rem;

  @media (max-width: 600px) {
    padding: 1.25rem;
  }
`;

export const MissionMeta = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

export const MissionLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const MissionLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
`;

export const MissionTitle = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  line-height: 1.2;

  @media (max-width: 600px) {
    font-size: 1.2rem;
  }
`;

export const MissionPermission = styled.div`
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 0.125rem;
`;

export const PermissionBadge = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 1.5px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  flex-shrink: 0;
`;

export const BigProgressTrack = styled.div`
  height: 10px;
  background: var(--border);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 0.75rem;
`;

export const BigProgressFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => ($pct * 100).toFixed(1)}%;
  background: var(--accent);
  border-radius: 999px;
  transition: width 0.8s ease;
`;

export const ProgressMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

export const ProgressNarrative = styled.div`
  font-size: 0.875rem;
  color: var(--text-secondary);

  strong {
    color: var(--text-primary);
    font-weight: 600;
  }
`;

export const EtaText = styled.div`
  font-size: 0.8rem;
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
`;
