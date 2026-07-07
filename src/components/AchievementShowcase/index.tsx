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
import { IconMedal, IconCalendar, IconHourglass } from '@/components/Icon';
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
  AchievementInfoColumn,
  AchievementStatColumn,
  AchievementStatValue,
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
const FALLBACK_ACHIEVEMENT_IMAGE = '/assets/achievements/fallback.jpg';

const ACHIEVEMENT_IMAGE_KEY_BY_ID: Record<string, string> = {
  first5k: 'first-5km',
  first10k: 'first-10km',
  first15k: 'first-15km',
  first21k: 'first-21km',
  first31k: 'first-31km',
  first42k: 'first-42km',

  vol100: 'vol-100km',
  vol250: 'vol-250km',
  vol500: 'vol-500km',
  vol1000: 'vol-1000km',
  vol2500: 'vol-2500km',
  vol5000: 'vol-5000km',

  act10: 'act-10t',
  act25: 'act-25t',
  act50: 'act-50t',
  act100: 'act-100t',
  act250: 'act-250t',
  act500: 'act-500t',

  week3: 'sem-3t',
  week4: 'sem-4t',
  week5: 'sem-5t',
  week6: 'sem-6t',
  week7: 'sem-7t',

  month8: 'mes-8t',
  month12: 'mes-12t',
  month16: 'mes-16t',
  month20: 'mes-20t',

  pace600: 'ritm-1v',
  pace530: 'ritm-2v',
  pace500: 'ritm-3v',
  pace430: 'ritm-4v',
  pace400: 'ritm-5v',
  pace330: 'ritm-6v',

  trail5: 'exp-1t',
  trail25: 'exp-2t',
  trail100: 'exp-3t',
  alt3000: 'exp-4t',
  aconcagua: 'exp-5t',
  everest: 'exp-6t',
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
  const isUnlocked = achievement.unlocked && !!achievement.unlockedAt;

  const artwork = (
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
  );

  if (viewMode === 'list') {
    return (
      <AchievementCard $viewMode={viewMode} $unlocked={achievement.unlocked} title={tooltip}>
        {artwork}

        {/* Column 2: title + description */}
        <AchievementInfoColumn>
          <AchievementTitle $viewMode={viewMode}>{achievement.name}</AchievementTitle>
          <AchievementDescription $viewMode={viewMode}>{description}</AchievementDescription>
        </AchievementInfoColumn>

        {/* Column 3: medal + XP */}
        <AchievementStatColumn>
          <IconMedal size={26} color={isUnlocked ? '#fbbf24' : 'var(--text-muted)'} />
          <AchievementStatValue $tone={isUnlocked ? 'xp' : 'muted'}>+{achievement.xp} XP</AchievementStatValue>
        </AchievementStatColumn>

        {/* Column 4: date (unlocked) or progress (locked) */}
        <AchievementStatColumn>
          {isUnlocked ? (
            <>
              <IconCalendar size={26} color="#4ade80" />
              <AchievementStatValue $tone="unlocked">
                {formatDate(achievement.unlockedAt!)}
              </AchievementStatValue>
            </>
          ) : (
            <>
              <IconHourglass size={26} color="var(--text-muted)" />
              <AchievementStatValue $tone="muted">
                {achievement.progressText}
              </AchievementStatValue>
            </>
          )}
        </AchievementStatColumn>
      </AchievementCard>
    );
  }

  return (
    <AchievementCard $viewMode={viewMode} $unlocked={achievement.unlocked} title={tooltip}>
      {artwork}
      <AchievementBody>
        <AchievementXP $unlocked={achievement.unlocked}>+{achievement.xp} XP</AchievementXP>
        <AchievementTitle $viewMode={viewMode}>
          {achievement.name}
        </AchievementTitle>
        <AchievementDescription $viewMode={viewMode}>
          {description}
        </AchievementDescription>
        {isUnlocked ? (
          <AchievementMeta $unlocked>
            Desbloqueado: {formatDate(achievement.unlockedAt!)}
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
