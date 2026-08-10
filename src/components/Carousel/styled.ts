import styled from 'styled-components';

export const CarouselContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const DotsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
`;

export const DotSpan = styled.span<{ $isActive: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.$isActive ? 'var(--accent)' : 'var(--border)'};
  cursor: pointer;
  transition: background 0.3s;
`;
