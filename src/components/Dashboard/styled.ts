import styled from 'styled-components';

export const DashboardRoot = styled.div`
  min-height: 100vh;
  background: var(--bg-primary);
`;

export const DashboardHeader = styled.header`
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  position: sticky;
  top: 0;
  z-index: 10;
`;

export const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const HeaderLogo = styled.div`
  width: 32px;
  height: 32px;
  background: var(--accent);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
`;

export const HeaderTitle = styled.h1`
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
`;

export const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const CacheInfo = styled.span`
  font-size: 0.75rem;
  color: var(--text-muted);

  @media (max-width: 600px) {
    display: none;
  }
`;

export const HeaderButton = styled.button<{ $variant?: 'ghost' | 'primary' }>`
  background: ${({ $variant }) => ($variant === 'primary' ? 'var(--accent)' : 'transparent')};
  color: ${({ $variant }) => ($variant === 'primary' ? '#fff' : 'var(--text-secondary)')};
  border: 1px solid ${({ $variant }) => ($variant === 'primary' ? 'transparent' : 'var(--border)')};
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 500;
  padding: 0.45rem 0.875rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
  white-space: nowrap;

  &:hover {
    background: ${({ $variant }) => ($variant === 'primary' ? 'var(--accent-hover)' : 'var(--bg-card-hover)')};
    border-color: ${({ $variant }) => ($variant === 'primary' ? 'transparent' : 'var(--border-light)')};
    color: ${({ $variant }) => ($variant === 'primary' ? '#fff' : 'var(--text-primary)')};
  }
`;

export const DashboardContent = styled.main`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;

  @media (max-width: 600px) {
    padding: 1.25rem 1rem;
    gap: 2rem;
  }
`;

export const SectionTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
  letter-spacing: -0.01em;
`;

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

export const FullWidthChart = styled.div`
  grid-column: 1 / -1;
`;

export const LoadingOverlay = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 1rem;
`;

export const LoadingText = styled.p`
  color: var(--text-secondary);
  font-size: 1rem;
`;

export const LoadingCount = styled.span`
  color: var(--text-muted);
  font-size: 0.875rem;
`;

export const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
