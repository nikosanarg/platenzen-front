import styled from 'styled-components';

export const HeroCard = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;

  @media (max-width: 600px) {
    padding: 1.75rem 1.25rem;
    gap: 1.25rem;
  }
`;

export const LevelRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

export const LevelLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent);
`;

export const LevelName = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.03em;
  line-height: 1.1;

  @media (max-width: 600px) {
    font-size: 1.5rem;
  }
`;

export const XpRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const XpTrack = styled.div`
  flex: 1;
  height: 6px;
  background: var(--border);
  border-radius: 999px;
  overflow: hidden;
`;

export const XpFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => ($pct * 100).toFixed(1)}%;
  background: var(--accent);
  border-radius: 999px;
  transition: width 0.8s ease;
`;

export const XpLabel = styled.div`
  font-size: 0.75rem;
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
`;

export const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
`;

export const MomentumBadge = styled.div<{ $state: 'subiendo' | 'sostenido' | 'bajando' }>`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: ${({ $state }) =>
    $state === 'subiendo' ? '#4ade80' : $state === 'bajando' ? '#f59e0b' : 'var(--text-secondary)'};
`;

export const StreakText = styled.div`
  font-size: 0.8rem;
  color: var(--text-secondary);

  strong {
    color: var(--text-primary);
    font-weight: 600;
  }
`;

export const NextMilestone = styled.div`
  padding-top: 1.25rem;
  border-top: 1px solid var(--border);
  font-size: 0.825rem;
  color: var(--text-muted);
  line-height: 1.5;

  strong {
    color: var(--text-primary);
    font-weight: 500;
  }
`;
