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
  AchievementBody,
  AchievementTitle,
  AchievementDescription,
  AchievementXP,
  AchievementMeta,
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

const VIEW_MODE_STORAGE_KEY = 'achievement-showcase.view-mode';
const FALLBACK_ACHIEVEMENT_IMAGE = '/assets/achievements/fallback.png';

const ACHIEVEMENT_IMAGE_KEY_BY_ID: Record<string, string> = {
  first5k: 'first-5km',
  first10k: 'first-10km',
  first15k: 'first-15km',
  first21k: 'first-21k',
  first31k: 'first-31k',
  first42k: 'first-42k',

  vol100: 'vol-100',
  vol250: 'vol-250',
  vol500: 'vol-500',
  vol1000: 'vol-1000',
  vol2500: 'vol-2500',
  vol5000: 'vol-5000',

  act10: 'act-10',
  act25: 'act-25',
  act50: 'act-50',
  act100: 'act-100',
  act200: 'act-200',

  week3: 'week-3',
  week4: 'week-4',
  week5: 'week-5',
  week6: 'week-6',
  week7: 'week-7',

  month8: 'month-8',
  month12: 'month-12',
  month16: 'month-16',
  month20: 'month-20',

  pace600: 'pace-600',
  pace530: 'pace-530',
  pace500: 'pace-500',
  pace430: 'pace-430',
  pace400: 'pace-400',

  first_trail: 'first-trail',
  five_trail: 'five-trail',
  elev200: 'elev-200',
  elev5000: 'elev-5000',
};

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

function achievementImageCandidates(achievementId: string): string[] {
  const imageKey = ACHIEVEMENT_IMAGE_KEY_BY_ID[achievementId];
  if (!imageKey) return [FALLBACK_ACHIEVEMENT_IMAGE];
  return [
    `/assets/achievements/${imageKey}.png`,
    `/assets/achievements/${imageKey}.jpg`,
    FALLBACK_ACHIEVEMENT_IMAGE,
  ];
}

function AchievementCardItem({
  achievement,
  viewMode,
}: {
  achievement: Achievement;
  viewMode: ViewMode;
}) {
  const imageCandidates = React.useMemo(() => achievementImageCandidates(achievement.id), [achievement.id]);
  const [imageCandidateIndex, setImageCandidateIndex] = useState(0);
  const imageSrc = imageCandidates[imageCandidateIndex] ?? FALLBACK_ACHIEVEMENT_IMAGE;
  const description = achievement.description;
  const tooltip = `${achievement.name} — ${description}`;

  return (
    <AchievementCard $viewMode={viewMode} $unlocked={achievement.unlocked} title={tooltip}>
      <AchievementArtwork $viewMode={viewMode} $unlocked={achievement.unlocked}>
        <AchievementImage
          src={imageSrc}
          alt={achievement.name}
          $unlocked={achievement.unlocked}
          loading="lazy"
          onError={() => {
            if (imageCandidateIndex < imageCandidates.length - 1) {
              setImageCandidateIndex((idx) => idx + 1);
            }
          }}
        />
      </AchievementArtwork>
      <AchievementBody>
        <AchievementXP $unlocked={achievement.unlocked}>+{achievement.xp} XP</AchievementXP>
        <AchievementTitle $viewMode={viewMode}>
          {achievement.name}
        </AchievementTitle>
        <AchievementDescription $viewMode={viewMode}>
          {description}
        </AchievementDescription>
        {achievement.unlocked && achievement.unlockedAt ? (
          <AchievementMeta $unlocked>
            Desbloqueado: {formatDate(achievement.unlockedAt)}
          </AchievementMeta>
        ) : (
          <AchievementMeta $unlocked={false}>
            Progreso: {achievement.progressText}
          </AchievementMeta>
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
