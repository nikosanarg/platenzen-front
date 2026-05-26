import styled, { keyframes } from 'styled-components';

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
`;

export const PanelRoot = styled.section``;

export const SubSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const SubSectionTitle = styled.h3`
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--text-muted);
`;

export const CollectionCount = styled.div`
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: -0.25rem;
`;

/* ── Medallero ─────────────────────────────────────────────── */

export const MedalleroGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
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
  letter-spacing: 0.04em;
  color: #fff;
`;

export const MedalleroCategory = styled.div`
  font-size: 0.72rem;
  color: var(--text-muted);
`;

export const MedalleroTierName = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
`;

export const TierDots = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
`;

export const TierDot = styled.span<{ $filled: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $filled }) => ($filled ? 'var(--accent)' : 'var(--border-light)')};
  flex-shrink: 0;
`;

/* ── Mission items ─────────────────────────────────────────── */

export const MissionsStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
`;

export const MissionItem = styled.div<{ $cerca?: boolean }>`
  background: var(--bg-card);
  border: 1px solid ${({ $cerca }) => ($cerca ? 'var(--accent)' : 'var(--border)')};
  border-radius: var(--radius);
  padding: 1rem 1.125rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
  overflow: hidden;

  ${({ $cerca }) =>
    $cerca &&
    `&::before {
      content: '';
      position: absolute;
      inset: 0;
      background: var(--accent);
      opacity: 0.04;
      pointer-events: none;
    }`}
`;

export const MissionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.875rem;
`;

export const MissionCodeBadge = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1.5px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  flex-shrink: 0;
`;

export const MissionInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

export const MissionCategory = styled.div`
  font-size: 0.68rem;
  color: var(--text-muted);
`;

export const MissionTierName = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
`;

export const MissionProgressText = styled.div`
  font-size: 0.73rem;
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
  font-size: 0.68rem;
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
`;

export const CercaBadge = styled.span`
  position: absolute;
  top: 0.625rem;
  right: 0.75rem;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
`;

/* ── Secretos ──────────────────────────────────────────────── */

export const SecretGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.75rem;

  @media (max-width: 600px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

export const SecretCard = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
`;

export const SecretBadge = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1.5px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--border-light);
  animation: ${pulse} 3s ease-in-out infinite;
`;

export const SecretLabel = styled.div`
  font-size: 0.7rem;
  color: var(--border-light);
  animation: ${pulse} 3s ease-in-out infinite;
`;

export const EmptyUnlocked = styled.div`
  font-size: 0.875rem;
  color: var(--text-muted);
  padding: 0.5rem 0;
`;
