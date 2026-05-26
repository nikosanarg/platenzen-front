'use client';

import React from 'react';
import { DayStats } from '@/types/stats';
import {
  HeatmapCard,
  HeatmapTitle,
  HeatmapGrid,
  HeatmapCol,
  HeatmapCell,
  HeatmapLegend,
  LegendLabel,
} from './styled';

interface ActivityHeatmapProps {
  data: DayStats[];
}

function buildGrid(data: DayStats[]): Map<string, number> {
  const countMap = new Map<string, number>();
  for (const d of data) countMap.set(d.date, d.count);
  return countMap;
}

function getLevel(count: number): number {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

function getWeeksInLastYear(): string[][] {
  const today = new Date();
  const start = new Date(today);
  start.setFullYear(start.getFullYear() - 1);
  // rewind to last Sunday
  start.setDate(start.getDate() - start.getDay());

  const weeks: string[][] = [];
  const cur = new Date(start);
  while (cur <= today) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ data }) => {
  const countMap = buildGrid(data);
  const weeks = getWeeksInLastYear();

  return (
    <HeatmapCard>
      <HeatmapTitle>Tu año en kilómetros</HeatmapTitle>
      <HeatmapGrid>
        {weeks.map((week, wi) => (
          <HeatmapCol key={wi}>
            {week.map((date) => {
              const count = countMap.get(date) ?? 0;
              return (
                <HeatmapCell
                  key={date}
                  $level={getLevel(count)}
                  title={count > 0 ? `${date}: ${count} actividad${count > 1 ? 'es' : ''}` : date}
                />
              );
            })}
          </HeatmapCol>
        ))}
      </HeatmapGrid>
      <HeatmapLegend>
        <LegendLabel>Menos</LegendLabel>
        {[0, 1, 2, 3, 4].map((l) => (
          <HeatmapCell key={l} $level={l} />
        ))}
        <LegendLabel>Más</LegendLabel>
      </HeatmapLegend>
    </HeatmapCard>
  );
};

export default ActivityHeatmap;
