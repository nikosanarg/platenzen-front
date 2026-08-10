import styled, { css, keyframes } from 'styled-components';

// ── Freshness glow (logros recién desbloqueados) ─────────────────────────────

const spinClockwise = keyframes`
  to { transform: rotate(360deg); }
`;

const spinCounter = keyframes`
  to { transform: rotate(-360deg); }
`;

const twinkle = keyframes`
  0%, 100% { opacity: 0.28; }
  50% { opacity: 0.72; }
`;

/* Dorado = desbloqueado hace menos de una semana; plata = menos de un mes y gira
   más lento. El dorado reusa el var(--xp) que ya marca XP y medalla en esta sección. */
const FRESHNESS_TIERS = {
  gold: {
    core: 'rgba(var(--xp-rgb), 0.85)',
    soft: 'rgba(var(--xp-rgb), 0.32)',
    haloDuration: '1.9s',
    sparkDuration: '2.7s',
    cardShadow: '0 0 0 1px rgba(var(--xp-rgb), 0.4), 0 0 20px rgba(var(--xp-rgb), 0.2)',
  },
  silver: {
    core: 'rgba(226, 232, 240, 0.78)',
    soft: 'rgba(203, 213, 225, 0.26)',
    haloDuration: '4.5s',
    sparkDuration: '6.5s',
    cardShadow: '0 0 0 1px rgba(203, 213, 225, 0.34), 0 0 18px rgba(203, 213, 225, 0.16)',
  },
} as const;

export const AchievementCardShell = styled.div<{ $tier: 'gold' | 'silver' | null }>`
  position: relative;
  display: flex;
  min-width: 0;

  ${({ $tier }) => {
    if (!$tier) return null;
    const tier = FRESHNESS_TIERS[$tier];

    return css`
      /* Halo difuso girando: el brillo de fondo */
      &::before,
      &::after {
        content: '';
        position: absolute;
        border-radius: calc(var(--radius-sm) + 8px);
        pointer-events: none;
        z-index: 0;
      }

      &::before {
        inset: -6px;
        background: conic-gradient(
          from 0deg,
          transparent 0deg,
          ${tier.core} 30deg,
          ${tier.soft} 75deg,
          transparent 135deg,
          transparent 195deg,
          ${tier.core} 225deg,
          ${tier.soft} 270deg,
          transparent 330deg
        );
        filter: blur(8px);
        animation: ${spinClockwise} ${tier.haloDuration} linear infinite;
      }

      /* Partículas: destellos finos girando en sentido contrario, más lento */
      &::after {
        inset: -10px;
        background: repeating-conic-gradient(
          from 0deg,
          transparent 0deg 13deg,
          ${tier.core} 13deg 15deg,
          transparent 15deg 30deg
        );
        filter: blur(2.5px);
        animation: ${spinCounter} ${tier.sparkDuration} linear infinite,
          ${twinkle} 2.6s ease-in-out infinite;
      }
    `;
  }}
`;

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
  color: ${({ $active }) => ($active ? 'var(--text-on-accent)' : 'var(--text-secondary)')};
  border: none;
  border-radius: 8px;
  padding: 0.4rem 0.85rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    color: ${({ $active }) => ($active ? 'var(--text-on-accent)' : 'var(--text-primary)')};
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
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.8rem;

  /* Wide desktop: up to 2 cards per row (items 1&2, then 3&4, …) */
  @media (min-width: 1280px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const AchievementsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.9rem;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(4, 1fr);
  }

  @media (max-width: 800px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 560px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const AchievementCard = styled.article<{
  $viewMode: 'list' | 'grid';
  $unlocked: boolean;
  $tier: 'gold' | 'silver' | null;
}>`
  background: var(--bg-card);
  border: 1px solid ${({ $unlocked }) => ($unlocked ? 'rgba(var(--positive-rgb), 0.35)' : 'var(--border)')};
  border-radius: var(--radius-sm);
  padding: ${({ $viewMode }) => ($viewMode === 'list' ? '0.55rem' : '0.72rem')};
  /* Tapa la parte interna del halo, que sólo debe verse por fuera del borde */
  position: relative;
  z-index: 1;
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: ${({ $viewMode }) => ($viewMode === 'list' ? 'row' : 'column')};
  align-items: ${({ $viewMode }) => ($viewMode === 'list' ? 'stretch' : 'flex-start')};
  gap: ${({ $viewMode }) => ($viewMode === 'list' ? '0.65rem' : '0.6rem')};
  min-height: ${({ $viewMode }) => ($viewMode === 'list' ? '84px' : '252px')};
  opacity: ${({ $unlocked }) => ($unlocked ? 1 : 0.7)};
  box-shadow: ${({ $unlocked, $tier }) =>
    $tier
      ? FRESHNESS_TIERS[$tier].cardShadow
      : $unlocked
        ? '0 0 0 1px rgba(var(--success-rgb), 0.22), 0 0 18px rgba(var(--success-rgb), 0.16)'
        : 'none'};
  transition: border-color 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    border-color: var(--border-light);
    opacity: 1;
    box-shadow: ${({ $unlocked, $tier }) =>
      $tier
        ? FRESHNESS_TIERS[$tier].cardShadow
        : $unlocked
          ? '0 0 0 1px rgba(var(--positive-rgb), 0.32), 0 0 22px rgba(var(--positive-rgb), 0.22)'
          : 'none'};
  }

  @media (max-width: 600px) {
    min-height: ${({ $viewMode }) => ($viewMode === 'list' ? '76px' : '252px')};
  }
`;

export const AchievementArtwork = styled.div<{ $viewMode: 'list' | 'grid'; $unlocked: boolean }>`
  position: relative;
  flex-shrink: 0;
  width: ${({ $viewMode }) => ($viewMode === 'list' ? '68px' : '100%')};
  height: ${({ $viewMode }) => ($viewMode === 'list' ? '68px' : 'auto')};
  aspect-ratio: ${({ $viewMode }) => ($viewMode === 'list' ? 'auto' : '1 / 1')};
  border-radius: 6px;
  overflow: hidden;
  box-shadow: ${({ $unlocked }) => ($unlocked ? '0 0 0 1px rgba(var(--positive-rgb), 0.35), 0 0 14px rgba(var(--positive-rgb), 0.22)' : 'none')};

  @media (max-width: 600px) {
    width: ${({ $viewMode }) => ($viewMode === 'list' ? '60px' : '100%')};
    height: ${({ $viewMode }) => ($viewMode === 'list' ? '60px' : 'auto')};
  }
`;

export const AchievementImage = styled.img<{ $unlocked: boolean }>`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  filter: ${({ $unlocked }) =>
    $unlocked ? 'none' : 'grayscale(1) brightness(0.52) contrast(1.05) blur(2px)'};
  transform: ${({ $unlocked }) => ($unlocked ? 'scale(1.01)' : 'scale(1.06)')};
`;

export const AchievementBody = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 0.28rem;
  width: 100%;
  min-width: 0;
`;

// ── List-mode columns ────────────────────────────────────────────────────────

export const AchievementInfoColumn = styled.div`
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  gap: 0.3rem;
`;

export const AchievementStatColumn = styled.div`
  display: flex;
  flex-shrink: 0;
  width: 104px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding-left: 0.5rem;
  border-left: 1px solid var(--border);
  text-align: center;

  @media (max-width: 600px) {
    width: 76px;
    padding-left: 0.35rem;
  }
`;

export const AchievementStatValue = styled.span<{ $tone: 'xp' | 'unlocked' | 'muted' }>`
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.25;
  color: ${({ $tone }) =>
    $tone === 'xp' ? 'var(--xp)' : $tone === 'unlocked' ? 'var(--positive)' : 'var(--text-muted)'};
`;

export const AchievementXP = styled.div<{ $unlocked: boolean }>`
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: ${({ $unlocked }) => ($unlocked ? 'var(--positive)' : 'var(--text-secondary)')};
  margin-bottom: 0.1rem;
`;

export const AchievementTitle = styled.h4<{ $viewMode: 'list' | 'grid' }>`
  font-size: ${({ $viewMode }) => ($viewMode === 'list' ? '0.9rem' : '0.98rem')};
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
  font-size: ${({ $viewMode }) => ($viewMode === 'list' ? '0.79rem' : '0.82rem')};
  color: var(--text-secondary);
  line-height: 1.35;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  text-overflow: ellipsis;
`;

export const AchievementMeta = styled.div<{ $unlocked: boolean }>`
  margin-top: auto;
  font-size: 0.78rem;
  color: ${({ $unlocked }) => ($unlocked ? 'var(--positive)' : 'var(--warning)')};
  font-weight: 500;
`;
