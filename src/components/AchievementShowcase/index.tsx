'use client';

import React, { useState } from 'react';
import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';
import {
  computeAchievements,
  CATEGORY_LABELS,
  AchievementCategory,
  Achievement,
} from '@/lib/achievements';
import {
  ShowcaseRoot,
  CategoryBlock,
  CategoryHeader,
  CategoryTitle,
  ConceptBlock,
  ConceptTitle,
  ViewModeSwitch,
  ViewModeButton,
  AchievementsList,
  AchievementsGrid,
  AchievementCard,
  AchievementArtwork,
  AchievementImage,
  AchievementImageFallback,
  AchievementBody,
  AchievementTitle,
  AchievementDescription,
  AchievementXP,
  AchievementDate,
} from './styled';

const CATEGORY_ORDER: AchievementCategory[] = [
  'distance',
  'volume',
  'consistency',
  'speed',
  'exploration',
];

const CONSISTENCY_GROUPS = [
  { key: 'actividades', idsPrefix: 'act', title: 'Actividades' },
  { key: 'semanal', idsPrefix: 'week', title: 'Semanal' },
  { key: 'mensual', idsPrefix: 'month', title: 'Mensual' },
] as const;

const VIEW_MODE_STORAGE_KEY = 'platenzen.achievements.viewMode';

interface AchievementShowcaseProps {
  activities: StravaActivity[];
  stats: ProcessedStats;
}

type ViewMode = 'list' | 'grid';

function getStoredViewMode(): ViewMode {
  if (typeof window === 'undefined') return 'list';
  try {
    const storedMode = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return storedMode === 'grid' ? 'grid' : 'list';
  } catch {
    return 'list';
  }
}

function achievementImagePath(achievementId: string): string {
  return `/assets/achievements/${achievementId}.png`;
}

function achievementLongDescription(achievement: Achievement): string {
  if (achievement.unlocked) {
    return `${achievement.description}. ${achievement.unlockedReason}`;
  }
  return `${achievement.description}. Progreso: ${achievement.progressText}`;
}

function AchievementCardItem({
  achievement,
  viewMode,
}: {
  achievement: Achievement;
  viewMode: ViewMode;
}) {
  const [imageError, setImageError] = useState(false);
  const description = achievementLongDescription(achievement);
  const tooltip = `${achievement.name} — ${description}`;

  return (
    <AchievementCard $viewMode={viewMode} $unlocked={achievement.unlocked} title={tooltip}>
      <AchievementArtwork $viewMode={viewMode}>
        {!imageError && (
          <AchievementImage
            src={achievementImagePath(achievement.id)}
            alt={achievement.name}
            loading="lazy"
            onError={() => setImageError(true)}
          />
        )}
        {imageError && <AchievementImageFallback>🏆</AchievementImageFallback>}
      </AchievementArtwork>
      <AchievementBody>
        <AchievementXP $unlocked={achievement.unlocked}>+{achievement.xp} XP</AchievementXP>
        <AchievementTitle title={achievement.name} $viewMode={viewMode}>
          {achievement.name}
        </AchievementTitle>
        <AchievementDescription title={description} $viewMode={viewMode}>
          {description}
        </AchievementDescription>
        {achievement.unlocked && achievement.unlockedAt && (
          <AchievementDate>Desbloqueado: {formatDate(achievement.unlockedAt)}</AchievementDate>
        )}
      </AchievementBody>
    </AchievementCard>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

const AchievementShowcase: React.FC<AchievementShowcaseProps> = ({ activities, stats }) => {
  const achievementMap = computeAchievements(activities, stats);
  const [viewMode, setViewMode] = useState<ViewMode>(getStoredViewMode);

  const onChangeViewMode = (nextMode: ViewMode) => {
    setViewMode(nextMode);
    try {
      window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, nextMode);
    } catch {
      // noop: view preference persistence is optional
    }
  };

  return (
    <ShowcaseRoot>
      <ViewModeSwitch>
        <ViewModeButton $active={viewMode === 'list'} onClick={() => onChangeViewMode('list')}>
          Lista
        </ViewModeButton>
        <ViewModeButton $active={viewMode === 'grid'} onClick={() => onChangeViewMode('grid')}>
          Cuadrícula
        </ViewModeButton>
      </ViewModeSwitch>

      {CATEGORY_ORDER.map(cat => {
        const achs = achievementMap[cat];
        if (!achs?.length) return null;

        if (cat === 'consistency') {
          const groups = CONSISTENCY_GROUPS
            .map(group => ({
              title: group.title,
              achievements: achs.filter(a => a.id.startsWith(group.idsPrefix)),
            }))
            .filter(group => group.achievements.length > 0);

          return (
            <CategoryBlock key={cat}>
              <CategoryHeader>
                <CategoryTitle>{CATEGORY_LABELS[cat]}</CategoryTitle>
              </CategoryHeader>
              {groups.map(group => (
                <ConceptBlock key={group.title}>
                  <ConceptTitle>{group.title}</ConceptTitle>
                  {viewMode === 'list' ? (
                    <AchievementsList>
                      {group.achievements.map(achievement => (
                        <AchievementCardItem
                          key={achievement.id}
                          achievement={achievement}
                          viewMode={viewMode}
                        />
                      ))}
                    </AchievementsList>
                  ) : (
                    <AchievementsGrid>
                      {group.achievements.map(achievement => (
                        <AchievementCardItem
                          key={achievement.id}
                          achievement={achievement}
                          viewMode={viewMode}
                        />
                      ))}
                    </AchievementsGrid>
                  )}
                </ConceptBlock>
              ))}
            </CategoryBlock>
          );
        }

        return (
          <CategoryBlock key={cat}>
            <CategoryHeader>
              <CategoryTitle>{CATEGORY_LABELS[cat]}</CategoryTitle>
            </CategoryHeader>
            {viewMode === 'list' ? (
              <AchievementsList>
                {achs.map(achievement => (
                  <AchievementCardItem key={achievement.id} achievement={achievement} viewMode={viewMode} />
                ))}
              </AchievementsList>
            ) : (
              <AchievementsGrid>
                {achs.map(achievement => (
                  <AchievementCardItem key={achievement.id} achievement={achievement} viewMode={viewMode} />
                ))}
              </AchievementsGrid>
            )}
          </CategoryBlock>
        );
      })}
    </ShowcaseRoot>
  );
};

function formatDate(iso: string): string {
  const [y, mo, d] = iso.slice(0, 10).split('-').map(Number);
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${d} ${months[mo - 1]} ${y}`;
}

export default AchievementShowcase;
