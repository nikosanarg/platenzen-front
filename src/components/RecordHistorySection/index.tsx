'use client';

import React from 'react';
import { Activity } from '@/types/activity';
import { computeRecordHistories, formatRecordTime, formatImprovement, shortDate, formatPace } from '@/lib/recordHistory';
import { SectionTitle } from '@/components/Dashboard/styled';
import StatCard from '@/components/StatCard';
import { HistoryRoot, HistoryList, DistanceLabel, ActivityName, ImprovementText, NoRecord } from './styled';

/** 21.0975 → "21.1"; 5/10/15 → "5"/"10"/"15": sin ceros decimales de más. */
function formatDistance(km: number): string {
  return km % 1 === 0 ? `${km}` : km.toFixed(1);
}

interface RecordHistorySectionProps {
  activities: Activity[];
}

/**
 * Los hitos: cuánto le sacaste a tu propia marca en 5K/10K/15K/21K. Vive en la
 * sidebar como una lista compacta, una fila por distancia — no como grilla de
 * tarjetas, que pesaba lo mismo que el contenido principal por algo que es un
 * apunte al margen de la historia, no su centro.
 */
const RecordHistorySection: React.FC<RecordHistorySectionProps> = ({ activities }) => {
  const histories = computeRecordHistories(activities);
  const hasAny = histories.some(h => h.currentBest !== null);
  if (!hasAny) return null;

  return (
    <HistoryRoot>
      <SectionTitle>Récords</SectionTitle>
      <HistoryList>
        {histories.map(h =>
          h.currentBest ? (
            <StatCard
              key={h.label}
              href={`https://www.strava.com/activities/${h.currentBest.activityId}`}
              target="_blank"
              rel="noopener noreferrer"
              hasStravaBadge
              leftVisual={<DistanceLabel>{h.label}</DistanceLabel>}
              title={<ActivityName>{h.currentBest.activityName}</ActivityName>}
              primaryValue={formatRecordTime(h.currentBest.projectedTimeSeconds)}
              subtitles={[
                `${formatDistance(h.distanceKm)} km · ${formatPace(h.currentBest.pace)}`,
                shortDate(h.currentBest.date),
              ]}
              secondaryValue={
                h.currentBest.improvementSeconds !== null ? (
                  <ImprovementText>▼ {formatImprovement(h.currentBest.improvementSeconds)}</ImprovementText>
                ) : (
                  'primera marca'
                )
              }
            />
          ) : (
            <NoRecord key={h.label}>
              <DistanceLabel>{h.label}</DistanceLabel>
              <span>Sin salidas de {h.distanceKm >= 15 ? h.label : `+${h.minM / 1000} km`}</span>
            </NoRecord>
          )
        )}
      </HistoryList>
    </HistoryRoot>
  );
};

export default RecordHistorySection;
