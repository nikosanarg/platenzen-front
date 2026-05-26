import styled from 'styled-components';

export const RawRoot = styled.section``;

export const ToggleBtn = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  letter-spacing: 0.04em;

  &:hover {
    color: var(--text-secondary);
  }
`;

export const Chevron = styled.span<{ $open: boolean }>`
  display: inline-block;
  font-size: 0.6rem;
  transform: ${({ $open }) => ($open ? 'rotate(180deg)' : 'rotate(0deg)')};
  transition: transform 0.2s ease;
  line-height: 1;
`;

export const StatsPanel = styled.div`
  margin-top: 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.5rem;
`;

export const StatsGroup = styled.div`
  margin-bottom: 1.25rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const GroupTitle = styled.div`
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 0.625rem;
`;

export const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.75rem 1.5rem;

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`;

export const StatValue = styled.div`
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
`;

export const StatLabel = styled.div`
  font-size: 0.68rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;
