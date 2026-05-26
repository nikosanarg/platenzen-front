import React from 'react';
import { ProcessedStats } from '@/types/stats';
import { generateInsights } from '@/utils/insights';
import { SectionRoot, SectionTitle, InsightList, InsightItem } from './styled';

interface InsightsSectionProps {
  stats: ProcessedStats;
}

const InsightsSection: React.FC<InsightsSectionProps> = ({ stats }) => {
  const insights = generateInsights(stats);
  if (insights.length === 0) return null;

  return (
    <SectionRoot>
      <SectionTitle>Insights</SectionTitle>
      <InsightList>
        {insights.map((insight, i) => (
          <InsightItem key={i}>{insight}</InsightItem>
        ))}
      </InsightList>
    </SectionRoot>
  );
};

export default InsightsSection;
