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
  background: ${({ $variant }) => ($variant === 'primary' ? 'var(--accent)' : 'var(--bg-card)')};
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

export const HomeTabsBar = styled.nav`
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 64px;
  z-index: 9;
`;

export const HomeTabsInner = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  gap: 0;
`;

export const HomeTabBtn = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  border-bottom: 2px solid ${({ $active }) => ($active ? 'var(--accent)' : 'transparent')};
  padding: 0.875rem 1.5rem;
  font-size: 0.9rem;
  font-weight: ${({ $active }) => ($active ? '700' : '400')};
  color: ${({ $active }) => ($active ? 'var(--text-primary)' : 'var(--text-muted)')};
  cursor: pointer;
  margin-bottom: -1px;
  letter-spacing: 0.01em;
  transition: color 0.15s, border-color 0.15s;
  white-space: nowrap;

  &:hover {
    color: var(--text-secondary);
  }
`;

export const DashboardContent = styled.main`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 3.5rem;

  @media (max-width: 600px) {
    padding: 1.5rem 1rem;
    gap: 2.5rem;
  }
`;

export const SectionTitle = styled.h2`
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--text-muted);
  margin-bottom: 1rem;
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
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

export const PatternsGrid = styled.div`
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;

  @media (min-width: 1200px) {
    grid-template-columns: 1fr 1fr 1fr;
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
