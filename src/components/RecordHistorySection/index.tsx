'use client';

import React from 'react';
import { StravaActivity } from '@/types/strava';
import { computeRecordHistories, formatRecordTime, formatImprovement, shortDate } from '@/lib/recordHistory';
import { SectionTitle } from '@/components/Dashboard/styled';
import {
  HistoryRoot,
  HistoryGrid,
  DistanceCard,
  DistanceLabel,
  CurrentTime,
  ImprovementBadge,
  RecordDate,
  NoRecord,
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
      <SectionTitle>Evolución de récords</SectionTitle>
      <HistoryGrid>
        {histories.map(h => (
          <DistanceCard key={h.label}>
            <DistanceLabel>{h.label}</DistanceLabel>
            {h.currentBest ? (
              <>
                <CurrentTime>{formatRecordTime(h.currentBest.projectedTimeSeconds)}</CurrentTime>
                <ImprovementBadge $isFirst={h.currentBest.improvementSeconds === null}>
                  {h.currentBest.improvementSeconds !== null ? (
                    <>▼ {formatImprovement(h.currentBest.improvementSeconds)} respecto al anterior</>
                  ) : (
                    <>primera marca</>
                  )}
                </ImprovementBadge>
                <RecordDate>{shortDate(h.currentBest.date)}</RecordDate>
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
