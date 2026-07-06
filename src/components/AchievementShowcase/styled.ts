import styled from 'styled-components';

export const ShowcaseRoot = styled.section`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

export const ViewModeSwitch = styled.div`
  display: inline-flex;
  align-self: flex-end;
  gap: 0.35rem;
  padding: 0.25rem;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-secondary);

  @media (max-width: 600px) {
    align-self: flex-start;
  }
`;

export const ViewModeButton = styled.button<{ $active: boolean }>`
  background: ${({ $active }) => ($active ? 'var(--accent)' : 'transparent')};
  color: ${({ $active }) => ($active ? '#fff' : 'var(--text-secondary)')};
  border: none;
  border-radius: 8px;
  padding: 0.4rem 0.85rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    color: ${({ $active }) => ($active ? '#fff' : 'var(--text-primary)')};
    background: ${({ $active }) => ($active ? 'var(--accent)' : 'var(--bg-card-hover)')};
  }
`;

export const CategoryBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
`;

export const CategoryHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const ConceptBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
`;

export const ConceptTitle = styled.h4`
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
`;

export const CategoryTitle = styled.h3`
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--text-muted);
`;

export const AchievementsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

export const AchievementsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.9rem;
`;

export const AchievementCard = styled.article<{ $viewMode: 'list' | 'grid'; $unlocked: boolean }>`
  background: var(--bg-card);
  border: 1px solid ${({ $unlocked }) => ($unlocked ? 'rgba(74, 222, 128, 0.35)' : 'var(--border)')};
  border-radius: var(--radius-sm);
  padding: 0.72rem;
  display: flex;
  flex-direction: ${({ $viewMode }) => ($viewMode === 'list' ? 'row' : 'column')};
  align-items: ${({ $viewMode }) => ($viewMode === 'list' ? 'stretch' : 'flex-start')};
  gap: ${({ $viewMode }) => ($viewMode === 'list' ? '0.8rem' : '0.6rem')};
  min-height: ${({ $viewMode }) => ($viewMode === 'list' ? '112px' : '252px')};
  opacity: ${({ $unlocked }) => ($unlocked ? 1 : 0.7)};
  box-shadow: ${({ $unlocked }) => ($unlocked ? '0 0 0 1px rgba(34, 197, 94, 0.22), 0 0 18px rgba(34, 197, 94, 0.16)' : 'none')};
  transition: border-color 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    border-color: var(--border-light);
    opacity: 1;
    box-shadow: ${({ $unlocked }) => ($unlocked ? '0 0 0 1px rgba(74, 222, 128, 0.32), 0 0 22px rgba(74, 222, 128, 0.22)' : 'none')};
  }
`;

export const AchievementArtwork = styled.div<{ $viewMode: 'list' | 'grid'; $unlocked: boolean }>`
  position: relative;
  flex-shrink: 0;
  width: ${({ $viewMode }) => ($viewMode === 'list' ? '96px' : '100%')};
  height: ${({ $viewMode }) => ($viewMode === 'list' ? '96px' : '146px')};
  border-radius: 6px;
  overflow: hidden;
  box-shadow: ${({ $unlocked }) => ($unlocked ? '0 0 0 1px rgba(74, 222, 128, 0.35), 0 0 14px rgba(74, 222, 128, 0.22)' : 'none')};
`;

export const AchievementImage = styled.img<{ $unlocked: boolean }>`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  filter: ${({ $unlocked }) => ($unlocked ? 'none' : 'grayscale(1) brightness(0.52) contrast(1.05)')};
  transform: scale(1.01);
`;

export const AchievementBody = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 0.28rem;
  width: 100%;
  min-width: 0;
`;

export const AchievementXP = styled.div<{ $unlocked: boolean }>`
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: ${({ $unlocked }) => ($unlocked ? '#4ade80' : 'var(--text-secondary)')};
  margin-bottom: 0.1rem;
`;

export const AchievementTitle = styled.h4<{ $viewMode: 'list' | 'grid' }>`
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
  overflow: hidden;
  ${({ $viewMode }) =>
    $viewMode === 'grid' &&
    `
      white-space: nowrap;
      text-overflow: ellipsis;
    `}
`;

export const AchievementDescription = styled.p<{ $viewMode: 'list' | 'grid' }>`
  font-size: 0.72rem;
  color: var(--text-secondary);
  line-height: 1.35;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: ${({ $viewMode }) => ($viewMode === 'grid' ? 2 : 3)};
  text-overflow: ellipsis;
`;

export const AchievementMeta = styled.div<{ $unlocked: boolean }>`
  margin-top: auto;
  font-size: 0.64rem;
  color: ${({ $unlocked }) => ($unlocked ? '#4ade80' : '#f59e0b')};
  font-weight: 500;
`;
