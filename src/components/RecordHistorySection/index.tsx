'use client';

import React from 'react';
import { Activity } from '@/types/activity';
import { computeRecordHistories, formatRecordTime, formatImprovement, shortDate, formatPace } from '@/lib/recordHistory';
import { SectionTitle } from '@/components/Dashboard/styled';
import {
  HistoryRoot,
  HistoryList,
  DistanceRow,
  RowHead,
  DistanceLabel,
  RowTime,
  RowMeta,
  ImprovementText,
  NoRecord,
} from './styled';

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
            <DistanceRow
              key={h.label}
              href={`https://www.strava.com/activities/${h.currentBest.activityId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <RowHead>
                <DistanceLabel>{h.label}</DistanceLabel>
                <RowTime>{formatRecordTime(h.currentBest.projectedTimeSeconds)}</RowTime>
              </RowHead>
              <RowMeta>
                <span>{formatPace(h.currentBest.pace)} · {shortDate(h.currentBest.date)}</span>
                {h.currentBest.improvementSeconds !== null ? (
                  <ImprovementText>▼ {formatImprovement(h.currentBest.improvementSeconds)}</ImprovementText>
                ) : (
                  <span>primera marca</span>
                )}
              </RowMeta>
            </DistanceRow>
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
