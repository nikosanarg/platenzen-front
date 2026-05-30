'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { DayStats } from '@/types/stats';
import {
  HeatmapCard,
  HeatmapTitle,
  HeatmapViewport,
  HeatmapLoading,
} from './styled';
import type { Heatmap3DCell, Heatmap3DSceneProps } from './scene';

const DAYS_IN_WEEK = 7;
const CELL_SIZE = 0.9;
const CELL_GAP = 0.18;
const GRID_STEP = CELL_SIZE + CELL_GAP;
const HEIGHT_PER_KM = 0.2;
function get3DMonthLabels(weeks: string[][]): Array<{ monthNum: number; weekIdx: number }> {
  const result: Array<{ monthNum: number; weekIdx: number }> = [];
  let lastMonth = '';
  weeks.forEach((week, wi) => {
    const month = week[0].split('-')[1];
    if (month !== lastMonth) {
      result.push({ monthNum: parseInt(month, 10), weekIdx: wi });
      lastMonth = month;
    }
  });
  return result;
}

const ActivityHeatmapScene3D = dynamic<Heatmap3DSceneProps>(() => import('./scene'), {
  ssr: false,
  loading: () => <HeatmapLoading>Cargando vista 3D</HeatmapLoading>,
});

interface ActivityHeatmapProps {
  data: DayStats[];
}

function buildDistanceGrid(data: DayStats[]): Map<string, number> {
  const distanceMap = new Map<string, number>();
  for (const d of data) distanceMap.set(d.date, d.distance);
  return distanceMap;
}

function getWeeksInLastYear(): string[][] {
  const today = new Date();
  const start = new Date(today);
  start.setFullYear(start.getFullYear() - 1);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // alinear a lunes

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
  const weeks = React.useMemo(() => getWeeksInLastYear(), []);

  const { cells, maxBarHeight } = React.useMemo(() => {
    const distanceMap = buildDistanceGrid(data);
    const xOffset = ((weeks.length - 1) * GRID_STEP) / 2;
    const zOffset = ((DAYS_IN_WEEK - 1) * GRID_STEP) / 2;

    const mappedCells: Heatmap3DCell[] = [];
    let tallest = 0;

    weeks.forEach((week, wi) => {
      week.forEach((date, di) => {
        const rawKm = distanceMap.get(date) ?? 0;
        const distanceKm = rawKm > 0 ? rawKm : 0;
        const height = distanceKm * HEIGHT_PER_KM;

        if (distanceKm > 0) {
          if (height > tallest) tallest = height;
        }

        mappedCells.push({
          date,
          distanceKm,
          height,
          x: wi * GRID_STEP - xOffset,
          z: (DAYS_IN_WEEK - 1 - di) * GRID_STEP - zOffset,
        });
      });
    });

    return {
      cells: mappedCells,
      maxBarHeight: tallest,
    };
  }, [data, weeks]);

  const gridWidth = Math.max(1, weeks.length) * GRID_STEP;
  const gridDepth = DAYS_IN_WEEK * GRID_STEP;

  return (
    <HeatmapCard>
      <HeatmapTitle>Tu año en actividad</HeatmapTitle>
      <HeatmapViewport style={{ marginLeft: '-10vw', width: 'calc(100% + 10vw)' }}>
        <ActivityHeatmapScene3D
          cells={cells}
          gridWidth={gridWidth}
          gridDepth={gridDepth}
          maxBarHeight={maxBarHeight}
          monthLabels={get3DMonthLabels(weeks)}
        />
      </HeatmapViewport>
    </HeatmapCard>
  );
};

export default ActivityHeatmap;
