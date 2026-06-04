import styled from 'styled-components';

export const Root = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const SessionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 0.875rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

export const SessionCard = styled.div`
  background: var(--bg-card);
  border: 1px solid rgba(184, 134, 11, 0.25);
  border-radius: var(--radius);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  position: relative;
  overflow: hidden;
  transition: border-color 0.2s;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #b8860b, #f5c518, #b8860b);
  }

  &:hover {
    border-color: rgba(245, 197, 24, 0.4);
  }
`;

export const SessionHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
`;

export const SessionName = styled.div`
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
`;

export const SessionDate = styled.div`
  font-size: 0.7rem;
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
`;

export const SessionStats = styled.div`
  display: flex;
  gap: 1.25rem;
`;

export const SessionStat = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
`;

export const SessionStatValue = styled.div`
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
`;

export const SessionStatLabel = styled.div`
  font-size: 0.62rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
`;

export const ReasonsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
`;

export const ReasonBadge = styled.div`
  font-size: 0.68rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  border: 1px solid rgba(245, 197, 24, 0.35);
  background: rgba(245, 197, 24, 0.07);
  color: #c9a42a;
`;

export const LegendaryIcon = styled.div`
  font-size: 1.1rem;
  line-height: 1;
`;

export const StravaBtn = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.72rem;
  font-weight: 500;
  color: #fc4c02;
  border: 1px solid rgba(252, 76, 2, 0.3);
  border-radius: 6px;
  padding: 0.3rem 0.625rem;
  transition: background 0.15s;
  text-decoration: none;
  align-self: flex-start;
  margin-top: auto;

  &:hover {
    background: rgba(252, 76, 2, 0.1);
  }
`;

export const EmptyState = styled.div`
  padding: 2rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.875rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
`;
