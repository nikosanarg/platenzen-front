'use client';

import React from 'react';
import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';
import { computePersonalRecords, formatProjectedTime, timeAgo } from '@/lib/personalRecords';
import { secPerKmToString } from '@/utils/pace';
import { SectionTitle } from '@/components/Dashboard/styled';
import {
  RecordsRoot,
  RecordsGrid,
  RecordCard,
  RecordCategory,
  RecordValue,
  RecordUnit,
  RecordSub,
  RecordDate,
  RecordActivity,
} from './styled';

interface PersonalRecordsProps {
  activities: StravaActivity[];
  stats: ProcessedStats;
}

const PersonalRecords: React.FC<PersonalRecordsProps> = ({ activities, stats }) => {
  const records = computePersonalRecords(activities, stats.weekly);

  const cards: Array<{ label: string; value: string; unit?: string; sub?: string; date?: string; activity?: string }> = [];

  if (records.best5k) {
    cards.push({
      label: 'Mejor 5K',
      value: formatProjectedTime(records.best5k.projectedTimeSeconds),
      sub: secPerKmToString(records.best5k.pace) + '/km',
      date: timeAgo(records.best5k.date),
      activity: records.best5k.activityName,
    });
  }

  if (records.best10k) {
    cards.push({
      label: 'Mejor 10K',
      value: formatProjectedTime(records.best10k.projectedTimeSeconds),
      sub: secPerKmToString(records.best10k.pace) + '/km',
      date: timeAgo(records.best10k.date),
      activity: records.best10k.activityName,
    });
  }

  if (records.best21k) {
    cards.push({
      label: 'Mejor 21K',
      value: formatProjectedTime(records.best21k.projectedTimeSeconds),
      sub: secPerKmToString(records.best21k.pace) + '/km',
      date: timeAgo(records.best21k.date),
      activity: records.best21k.activityName,
    });
  }

  if (records.longest) {
    const km = records.longest.distanceKm;
    const whole = Math.floor(km);
    const dec = Math.round((km - whole) * 10);
    cards.push({
      label: 'Carrera más larga',
      value: String(whole),
      unit: `,${dec} km`,
      sub: formatProjectedTime(records.longest.timeSeconds),
      date: timeAgo(records.longest.date),
      activity: records.longest.activityName,
    });
  }

  if (records.bestElevation) {
    cards.push({
      label: 'Mayor desnivel',
      value: String(records.bestElevation.elevationM),
      unit: ' m',
      sub: `${records.bestElevation.distanceKm} km`,
      date: timeAgo(records.bestElevation.date),
      activity: records.bestElevation.activityName,
    });
  }

  if (records.bestWeek) {
    cards.push({
      label: 'Mejor semana',
      value: String(records.bestWeek.distanceKm),
      unit: ' km',
      sub: records.bestWeek.weekLabel,
    });
  }

  if (cards.length === 0) return null;

  return (
    <RecordsRoot>
      <SectionTitle>Tus récords</SectionTitle>
      <RecordsGrid>
        {cards.map((c) => (
          <RecordCard key={c.label}>
            <RecordCategory>{c.label}</RecordCategory>
            <RecordValue>
              {c.value}
              {c.unit && <RecordUnit>{c.unit}</RecordUnit>}
            </RecordValue>
            {c.sub && <RecordSub>{c.sub}</RecordSub>}
            {c.activity && <RecordActivity title={c.activity}>{c.activity}</RecordActivity>}
            {c.date && <RecordDate>{c.date}</RecordDate>}
          </RecordCard>
        ))}
      </RecordsGrid>
    </RecordsRoot>
  );
};

export default PersonalRecords;
