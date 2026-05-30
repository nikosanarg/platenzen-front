'use client';

import React, { useState, useEffect } from 'react';
import { computePersonalRecords, formatProjectedTime, timeAgo } from '@/lib/personalRecords';
import { secPerKmToString } from '@/utils/pace';
import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';
import styled from 'styled-components';
import {
  RecordCard,
  RecordCategory,
  RecordValue,
  RecordUnit,
  RecordSub,
  RecordDate,
  RecordActivity,
  RecordEquiv,
} from '@/components/PersonalRecords/styled';

const DotSpan = styled.span<{ $isActive: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.$isActive ? 'var(--accent)' : 'var(--border)'};
  cursor: pointer;
  transition: background 0.3s;
`;

const CarouselContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const DotsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
`;

interface RecordsCarouselProps {
  activities: StravaActivity[];
  stats: ProcessedStats;
}

const RecordsCarousel: React.FC<RecordsCarouselProps> = ({ activities, stats }) => {
  const records = computePersonalRecords(activities, stats.weekly);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true);
  }, []);

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

  useEffect(() => {
    if (recordsList.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % recordsList.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [recordsList.length]);

  if (!isHydrated || recordsList.length === 0) return null;

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
      <DotsContainer>
        {recordsList.map((_, index) => (
          <DotSpan
            key={index}
            $isActive={index === currentIndex}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </DotsContainer>
    </CarouselContainer>
  );
};

export default RecordsCarousel;
