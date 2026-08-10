'use client';

import React, { useMemo } from 'react';
import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';
import { secondsToHMS } from '@/utils/units';
import { StatsPanel, StatsGroup, GroupTitle, StatsRow, StatItem, StatValue, StatLabel } from '@/components/RawDataSection/styled';
import { useCarousel, CarouselDots, CarouselContainer } from '@/components/Carousel';

interface AccumulatedCarouselProps {
  activities: StravaActivity[];
  stats: ProcessedStats;
}

const AccumulatedCarousel: React.FC<AccumulatedCarouselProps> = ({ activities, stats }) => {
  const periods = useMemo(() => {
    const now = new Date();
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    let last12MonthsDistance = 0;
    let last12MonthsActivities = 0;
    let oldestDate: Date | null = null;

    activities.forEach((activity) => {
      const actDate = new Date(activity.start_date);

      if (actDate >= oneYearAgo) {
        last12MonthsDistance += activity.distance / 1000;
        last12MonthsActivities += 1;
      }

      if (!oldestDate || actDate < oldestDate) {
        oldestDate = actDate;
      }
    });

    const oldestDateStr = oldestDate
      ? (oldestDate as Date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'N/A';

    return [
      {
        label: 'Histórico',
        distance: stats.totalDistance,
        time: stats.totalTime,
        activities: stats.totalActivities,
        detail: `desde ${oldestDateStr}`,
      },
      {
        label: 'Año actual',
        distance: stats.currentYearDistance,
        time: 0,
        activities: stats.currentYearActivities,
        detail: new Date().getFullYear().toString(),
      },
      {
        label: 'Últimos 12 meses',
        distance: last12MonthsDistance,
        time: 0,
        activities: last12MonthsActivities,
        detail: '365 días',
      },
    ];
  }, [activities, stats]);

  const { currentIndex, setCurrentIndex, ready } = useCarousel(periods.length);

  if (!ready) return null;

  const current = periods[currentIndex];

  return (
    <CarouselContainer>
      <StatsPanel>
        <StatsGroup>
          <GroupTitle>{current.label}</GroupTitle>
          <StatsRow>
            <StatItem>
              <StatValue>{current.distance.toFixed(1)} km</StatValue>
              <StatLabel>Distancia</StatLabel>
            </StatItem>
            {current.time > 0 && (
              <StatItem>
                <StatValue>{secondsToHMS(current.time)}</StatValue>
                <StatLabel>Tiempo</StatLabel>
              </StatItem>
            )}
            <StatItem>
              <StatValue>{current.activities}</StatValue>
              <StatLabel>Actividades</StatLabel>
            </StatItem>
          </StatsRow>
        </StatsGroup>
        <StatsGroup>
          <GroupTitle>Período</GroupTitle>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{current.detail}</div>
        </StatsGroup>
      </StatsPanel>
      <CarouselDots count={periods.length} currentIndex={currentIndex} onSelect={setCurrentIndex} />
    </CarouselContainer>
  );
};

export default AccumulatedCarousel;
