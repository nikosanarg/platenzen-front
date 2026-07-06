'use client';

import React from 'react';
import { DayStats } from '@/types/stats';
import {
  HeatmapCard,
  HeatmapBody,
  HeatmapCell,
  HeatmapContent,
  HeatmapDayLabel,
  HeatmapDayLabels,
  HeatmapGrid,
  HeatmapMonthCell,
  HeatmapMonthsRow,
  HeatmapViewport,
  HeatmapTooltip,
  HeatmapWeekColumn,
} from './styled';

const DAYS_IN_WEEK = 7;
const MONTH_LABELS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const DAY_LABELS = ['', 'LUN', '', 'MIÉ', '', 'VIE', ''];
const DAY_ARIA_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const TOOLTIP_WIDTH = 118;
const TOOLTIP_HEIGHT = 52;
const TOOLTIP_MARGIN = 6;
const TOOLTIP_OFFSET_X = 12;
const TOOLTIP_OFFSET_Y = 18;
const TOOLTIP_POSITION_THRESHOLD = 1;

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

function getMonthLabelsByWeek(weeks: string[]): string[] {
  let lastMonth = '';
  return weeks.map((date) => {
    const month = date.slice(5, 7);
    if (month === lastMonth) return '';
    lastMonth = month;
    return MONTH_LABELS[parseInt(month, 10) - 1];
  });
}

function getCellLevel(distanceKm: number, maxDistanceKm: number): number {
  if (distanceKm <= 0 || maxDistanceKm <= 0) return 0;
  const ratio = distanceKm / maxDistanceKm;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

function formatDate(date: string): string {
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y.slice(2)}`;
}

function formatKm(km: number): string {
  return Number.isInteger(km) ? km.toFixed(0) : km.toFixed(1);
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ data }) => {
  const weeks = React.useMemo(() => getWeeksInLastYear(), []);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = React.useState<{
    x: number;
    y: number;
    date: string;
    km: number;
  } | null>(null);

  const { distanceMap, maxDistanceKm } = React.useMemo(() => {
    const distanceMap = buildDistanceGrid(data);
    return { distanceMap, maxDistanceKm: Math.max(...Array.from(distanceMap.values()), 0) };
  }, [data]);

  const monthLabelsByWeek = React.useMemo(
    () => getMonthLabelsByWeek(weeks.map((week) => week[0])),
    [weeks]
  );
  const getTooltipPosition = React.useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const x = clientX - (rect?.left ?? 0);
    const y = clientY - (rect?.top ?? 0);
    const maxX = Math.max(TOOLTIP_MARGIN, (rect?.width ?? 0) - TOOLTIP_WIDTH - TOOLTIP_MARGIN);
    const maxY = Math.max(TOOLTIP_MARGIN, (rect?.height ?? 0) - TOOLTIP_HEIGHT - TOOLTIP_MARGIN);
    return {
      x: Math.min(Math.max(x + TOOLTIP_OFFSET_X, TOOLTIP_MARGIN), maxX),
      y: Math.min(Math.max(y - TOOLTIP_OFFSET_Y, TOOLTIP_MARGIN), maxY),
    };
  }, []);

  return (
    <HeatmapCard>
      <HeatmapViewport ref={containerRef}>
        <HeatmapContent>
          <HeatmapDayLabels>
            {Array.from({ length: DAYS_IN_WEEK }).map((_, dayIdx) => (
              <HeatmapDayLabel
                key={dayIdx}
                aria-label={DAY_ARIA_LABELS[dayIdx]}
                aria-hidden={DAY_LABELS[dayIdx] === ''}
              >
                {DAY_LABELS[dayIdx]}
              </HeatmapDayLabel>
            ))}
          </HeatmapDayLabels>

          <HeatmapBody>
            <HeatmapMonthsRow>
              {monthLabelsByWeek.map((monthLabel, weekIdx) => (
                <HeatmapMonthCell key={`${monthLabel}-${weekIdx}`}>{monthLabel}</HeatmapMonthCell>
              ))}
            </HeatmapMonthsRow>

            <HeatmapGrid>
              {weeks.map((week, weekIdx) => (
                <HeatmapWeekColumn key={`week-${weekIdx}`}>
                  {week.map((date) => {
                    const distanceKm = distanceMap.get(date) ?? 0;
                    const level = getCellLevel(distanceKm, maxDistanceKm);
                    return (
                      <HeatmapCell
                        key={date}
                        $level={level}
                        aria-label={`${formatDate(date)}: ${formatKm(distanceKm)} km`}
                        onMouseEnter={(e) => {
                          const coords = getTooltipPosition(e.clientX, e.clientY);
                          setTooltip({
                            x: coords.x,
                            y: coords.y,
                            date,
                            km: distanceKm,
                          });
                        }}
                        onMouseMove={(e) => {
                          const coords = getTooltipPosition(e.clientX, e.clientY);
                          setTooltip((current) =>
                            current
                              ? {
                                  ...current,
                              x:
                                Math.abs(current.x - coords.x) > TOOLTIP_POSITION_THRESHOLD
                                  ? coords.x
                                  : current.x,
                              y:
                                Math.abs(current.y - coords.y) > TOOLTIP_POSITION_THRESHOLD
                                  ? coords.y
                                  : current.y,
                            }
                              : current
                          );
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    );
                  })}
                </HeatmapWeekColumn>
              ))}
            </HeatmapGrid>
          </HeatmapBody>
        </HeatmapContent>

        {tooltip && (
          <HeatmapTooltip style={{ left: tooltip.x, top: tooltip.y }}>
            <div><b>{formatDate(tooltip.date)}</b></div>
            <div>{formatKm(tooltip.km)} km</div>
          </HeatmapTooltip>
        )}
      </HeatmapViewport>
    </HeatmapCard>
  );
};

export default ActivityHeatmap;
