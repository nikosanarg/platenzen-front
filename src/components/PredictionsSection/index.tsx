'use client';

import React from 'react';
import { ProcessedStats } from '@/types/stats';
import { PermissionProgress } from '@/types/gamification';
import { LevelInfo } from '@/lib/levels';
import { computePredictions } from '@/lib/predictions';
import { distanceEquivalence } from '@/utils/equivalences';
import { SectionTitle } from '@/components/Dashboard/styled';
import {
  PredictionsRoot,
  PredictionsGrid,
  PredictionCard,
  PredictionLabel,
  PredictionValue,
  PredictionDetail,
  PredictionEquiv,
} from './styled';

interface PredictionsSectionProps {
  stats: ProcessedStats;
  permissions: PermissionProgress[];
  levelInfo: LevelInfo;
}

const PredictionsSection: React.FC<PredictionsSectionProps> = ({ stats, permissions, levelInfo }) => {
  const predictions = computePredictions(stats, permissions, levelInfo);
  if (predictions.length === 0) return null;

  return (
    <PredictionsRoot>
      <SectionTitle>A este ritmo</SectionTitle>
      <PredictionsGrid>
        {predictions.map((p) => {
          const equiv = p.numericKm != null ? distanceEquivalence(p.numericKm) : null;
          return (
            <PredictionCard key={p.id}>
              <PredictionLabel>{p.label}</PredictionLabel>
              <PredictionValue>{p.value}</PredictionValue>
              <PredictionDetail>{p.detail}</PredictionDetail>
              {equiv && <PredictionEquiv>{equiv}</PredictionEquiv>}
            </PredictionCard>
          );
        })}
      </PredictionsGrid>
    </PredictionsRoot>
  );
};

export default PredictionsSection;
