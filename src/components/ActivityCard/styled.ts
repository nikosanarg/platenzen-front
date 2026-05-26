import styled from 'styled-components';

export const CardRoot = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const ActivityBadge = styled.span<{ $sport: string }>`
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0.2rem 0.6rem;
  border-radius: 100px;
  background: var(--accent-muted);
  color: var(--accent);
  width: fit-content;
`;

export const ActivityName = styled.h4`
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
`;

export const ActivityDate = styled.span`
  font-size: 0.8rem;
  color: var(--text-muted);
`;

export const ActivityStats = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.25rem;
`;

export const ActivityStat = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
`;

export const ActivityStatLabel = styled.span`
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

export const ActivityStatValue = styled.span`
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
`;
