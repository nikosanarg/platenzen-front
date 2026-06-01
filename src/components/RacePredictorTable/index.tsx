'use client';

import React from 'react';
import { StravaActivity } from '@/types/strava';
import { computeRacePredictions, formatRaceTime, formatRaceDate } from '@/lib/racePredictor';
import { SectionTitle } from '@/components/Dashboard/styled';
import {
  PredictorRoot,
  PredictorTable,
  PredictorHeader,
  ColHead,
  PredictorRow,
  DistanceLabel,
  TimeCell,
  TimeValue,
  TimeDate,
  EmptyTime,
  PredictedValue,
  PredictorNote,
} from './styled';

interface RacePredictorTableProps {
  activities: StravaActivity[];
}

const RacePredictorTable: React.FC<RacePredictorTableProps> = ({ activities }) => {
  const predictions = computeRacePredictions(activities);
  const hasAnyData = predictions.some(p => p.bestSeconds !== null || p.predictedSeconds !== null);

  if (!hasAnyData) return null;

  return (
    <PredictorRoot>
      <SectionTitle>Predicciones</SectionTitle>
      <PredictorTable>
        <PredictorHeader>
          <ColHead>Distancia</ColHead>
          <ColHead>Mejor marca</ColHead>
          <ColHead>Proyección</ColHead>
        </PredictorHeader>

        {predictions.map(row => (
          <PredictorRow key={row.distanceKm}>
            <DistanceLabel>{row.label}</DistanceLabel>

            <TimeCell>
              {row.bestSeconds !== null ? (
                <>
                  <TimeValue>{formatRaceTime(row.bestSeconds)}</TimeValue>
                  {row.bestDate && <TimeDate>{formatRaceDate(row.bestDate)}</TimeDate>}
                </>
              ) : (
                <EmptyTime>—</EmptyTime>
              )}
            </TimeCell>

            <TimeCell>
              {row.predictedSeconds !== null ? (
                <PredictedValue>{formatRaceTime(row.predictedSeconds)}</PredictedValue>
              ) : (
                <EmptyTime>—</EmptyTime>
              )}
            </TimeCell>
          </PredictorRow>
        ))}
      </PredictorTable>

      <PredictorNote>
        Mejor marca: mejor tiempo proyectado sobre esa distancia de los últimos 12 meses. Proyección calculada con la fórmula de Riegel (T₂ = T₁ × (D₂/D₁)^1.06) a partir del mejor rendimiento reciente.
      </PredictorNote>
    </PredictorRoot>
  );
};

export default RacePredictorTable;
