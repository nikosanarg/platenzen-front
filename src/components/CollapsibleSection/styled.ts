import styled from 'styled-components';

export const CollapseRoot = styled.section``;

export const CollapseToggle = styled.button`
  background: none;
  border: none;
  width: 100%;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  text-align: left;

  .col-title {
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.09em;
  }

  .col-subtitle {
    font-size: 0.7rem;
    color: var(--text-muted);
    letter-spacing: 0.03em;
    margin-top: 0.2rem;
    text-transform: none;
  }

  &:hover .col-title {
    color: var(--text-primary);
  }
`;

export const CollapseIndicator = styled.span<{ $open: boolean }>`
  font-size: 0.65rem;
  color: var(--text-muted);
  transform: ${({ $open }) => ($open ? 'rotate(180deg)' : 'rotate(0deg)')};
  transition: transform 0.2s ease;
  flex-shrink: 0;
  line-height: 1;
`;

export const CollapseBody = styled.div`
  margin-top: 1.25rem;
`;
