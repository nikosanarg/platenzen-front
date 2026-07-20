'use client';

import React from 'react';
import { StravaActivity } from '@/types/strava';
import { computeRecordHistories, formatRecordTime, formatImprovement, fullDate, formatPace } from '@/lib/recordHistory';
import { SectionTitle } from '@/components/Dashboard/styled';
import {
  HistoryRoot,
  HistoryGrid,
  DistanceCard,
  DistanceLabel,
  TimeRow,
  CurrentTime,
  PaceSmall,
  ImprovementBadge,
  RecordDate,
  NoRecord,
  StravaBtn,
} from './styled';

interface RecordHistorySectionProps {
  activities: StravaActivity[];
}

const RecordHistorySection: React.FC<RecordHistorySectionProps> = ({ activities }) => {
  const histories = computeRecordHistories(activities);
  const hasAny = histories.some(h => h.currentBest !== null);
  if (!hasAny) return null;

  return (
    <HistoryRoot>
      <SectionTitle>Sesiones legendarias</SectionTitle>
      <HistoryGrid>
        {histories.map(h => (
          <DistanceCard key={h.label}>
            <DistanceLabel>Récord {h.label}</DistanceLabel>
            {h.currentBest ? (
              <>
                <TimeRow>
                  <CurrentTime>{formatRecordTime(h.currentBest.projectedTimeSeconds)}</CurrentTime>
                  <PaceSmall>{formatPace(h.currentBest.pace)}</PaceSmall>
                </TimeRow>
                <ImprovementBadge $isFirst={h.currentBest.improvementSeconds === null}>
                  {h.currentBest.improvementSeconds !== null ? (
                    <>▼ {formatImprovement(h.currentBest.improvementSeconds)} respecto al anterior</>
                  ) : (
                    <>primera marca</>
                  )}
                </ImprovementBadge>
                <RecordDate>{fullDate(h.currentBest.date)}</RecordDate>
                <StravaBtn
                  href={`https://www.strava.com/activities/${h.currentBest.activityId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver en Strava ↗
                </StravaBtn>
              </>
            ) : (
              <NoRecord>Sin salidas de {h.distanceKm >= 15 ? h.label : `+${h.minM / 1000} km`}</NoRecord>
            )}
          </DistanceCard>
        ))}
      </HistoryGrid>
    </HistoryRoot>
  );
};

export default RecordHistorySection;
