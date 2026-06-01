'use client';

import React from 'react';
import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';
import { generateSmartInsights } from '@/utils/insights';
import { SectionTitle } from '@/components/Dashboard/styled';
import { SectionRoot, InsightList, InsightItem } from './styled';

interface InsightsSectionProps {
  activities: StravaActivity[];
  stats: ProcessedStats;
}

const InsightsSection: React.FC<InsightsSectionProps> = ({ activities, stats }) => {
  const insights = generateSmartInsights(activities, stats);
  if (insights.length === 0) return null;

  return (
    <SectionRoot>
      <SectionTitle>Lo que dicen tus datos</SectionTitle>
      <InsightList>
        {insights.map(insight => (
          <InsightItem key={insight.id}>{insight.text}</InsightItem>
        ))}
      </InsightList>
    </SectionRoot>
  );
};

export default InsightsSection;
