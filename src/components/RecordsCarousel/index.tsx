'use client';

import React from 'react';
import { computePersonalRecords, formatProjectedTime, timeAgo } from '@/lib/personalRecords';
import { secPerKmToString } from '@/utils/pace';
import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';
import {
  RecordCard,
  RecordCategory,
  RecordValue,
  RecordSub,
  RecordDate,
  RecordActivity,
} from '@/components/PersonalRecords/styled';
import { useCarousel, CarouselDots, CarouselContainer } from '@/components/Carousel';

interface RecordsCarouselProps {
  activities: StravaActivity[];
  stats: ProcessedStats;
}

const RecordsCarousel: React.FC<RecordsCarouselProps> = ({ activities, stats }) => {
  const records = computePersonalRecords(activities, stats.weekly);

  const recordsList = [
    records.best5k ? {
      label: 'Mejor 5K',
      value: formatProjectedTime(records.best5k.projectedTimeSeconds),
      sub: secPerKmToString(records.best5k.pace) + '/km',
      date: timeAgo(records.best5k.date),
      activity: records.best5k.activityName,
    } : null,
    records.best10k ? {
      label: 'Mejor 10K',
      value: formatProjectedTime(records.best10k.projectedTimeSeconds),
      sub: secPerKmToString(records.best10k.pace) + '/km',
      date: timeAgo(records.best10k.date),
      activity: records.best10k.activityName,
    } : null,
    records.best21k ? {
      label: 'Mejor 21K',
      value: formatProjectedTime(records.best21k.projectedTimeSeconds),
      sub: secPerKmToString(records.best21k.pace) + '/km',
      date: timeAgo(records.best21k.date),
      activity: records.best21k.activityName,
    } : null,
  ].filter(Boolean);

  const { currentIndex, setCurrentIndex, ready } = useCarousel(recordsList.length);

  if (!ready) return null;

  const current = recordsList[currentIndex]!;

  return (
    <CarouselContainer>
      <RecordCard>
        <RecordCategory>{current.label}</RecordCategory>
        <RecordValue>{current.value}</RecordValue>
        {current.sub && <RecordSub>{current.sub}</RecordSub>}
        {current.activity && <RecordActivity title={current.activity}>{current.activity}</RecordActivity>}
        {current.date && <RecordDate>{current.date}</RecordDate>}
      </RecordCard>
      <CarouselDots count={recordsList.length} currentIndex={currentIndex} onSelect={setCurrentIndex} />
    </CarouselContainer>
  );
};

export default RecordsCarousel;
