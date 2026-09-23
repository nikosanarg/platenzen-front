'use client';

import React from 'react';
import { DayHourCount } from '@/types/stats';
import { ChartCard, ChartTitle, ChartArea } from '../shared/styled';
import { HeatmapTooltip } from '../ActivityHeatmap/styled';
import { calculateTooltipPosition, updateTooltipPosition } from '../shared/heatmapTooltip';
import { Root, Grid, Corner, HourLabel, DayLabel, Cell } from './styled';

interface DayHourHeatmapProps {
  data: DayHourCount[];
  bare?: boolean;
}

const TOOLTIP_WIDTH = 150;
const TOOLTIP_HEIGHT = 52;

type TooltipState = {
  x: number;
  y: number;
  dayLabel: string;
  hour: number;
  count: number;
} | null;

function getCellLevel(count: number, maxCount: number): number {
  if (count <= 0 || maxCount <= 0) return 0;
  const ratio = count / maxCount;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}h`;
}

function formatCount(count: number): string {
  if (count === 0) return 'Sin actividad';
  return count === 1 ? '1 actividad' : `${count} actividades`;
}

/**
 * Reemplaza a "Por hora" + "Días activos": mismo dato leído junto, no dos
 * distribuciones marginales por separado. Cada celda es el conteo real de
 * salidas en esa combinación exacta de día y hora — no el producto de las
 * dos marginales, que asumiría independencia y taparía patrones reales como
 * "domingo a la mañana" siendo distinto de "domingo" en general.
 */
const DayHourHeatmap: React.FC<DayHourHeatmapProps> = ({ data, bare }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = React.useState<TooltipState>(null);

  const { days, hours, countMap, maxCount } = React.useMemo(() => {
    const countMap = new Map<string, number>();
    const hourTotals = new Array<number>(24).fill(0);
    const days: { day: number; label: string }[] = [];
    const seenDays = new Set<number>();
    let maxCount = 0;

    for (const entry of data) {
      countMap.set(`${entry.day}-${entry.hour}`, entry.count);
      hourTotals[entry.hour] += entry.count;
      if (entry.count > maxCount) maxCount = entry.count;
      if (!seenDays.has(entry.day)) {
        seenDays.add(entry.day);
        days.push({ day: entry.day, label: entry.dayLabel });
      }
    }

    const firstIdx = hourTotals.findIndex((c) => c > 0);
    const lastIdx = hourTotals.reduce((acc, c, i) => (c > 0 ? i : acc), -1);
    const hours =
      firstIdx === -1
        ? Array.from({ length: 24 }, (_, i) => i)
        : Array.from({ length: lastIdx - firstIdx + 1 }, (_, i) => firstIdx + i);

    return { days, hours, countMap, maxCount };
  }, [data]);

  const getTooltipPosition = React.useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    return calculateTooltipPosition(rect, clientX, clientY, TOOLTIP_WIDTH, TOOLTIP_HEIGHT);
  }, []);

  return (
    <ChartCard $bare={bare}>
      <ChartTitle>Día y hora</ChartTitle>
      <ChartArea>
        <Root ref={containerRef} style={{ '--hours': hours.length } as React.CSSProperties}>
          <Grid role="grid" aria-label="Actividad por día y hora">
            <Corner />
            {hours.map((hour) => (
              <HourLabel key={hour}>{hour % 2 === 0 ? formatHour(hour) : ''}</HourLabel>
            ))}

            {days.map(({ day, label }) => (
              <React.Fragment key={day}>
                <DayLabel>{label}</DayLabel>
                {hours.map((hour) => {
                  const count = countMap.get(`${day}-${hour}`) ?? 0;
                  const level = getCellLevel(count, maxCount);
                  return (
                    <Cell
                      key={hour}
                      $level={level}
                      type="button"
                      role="gridcell"
                      aria-label={`${label} ${formatHour(hour)}: ${formatCount(count)}`}
                      onMouseEnter={(e) => {
                        const coords = getTooltipPosition(e.clientX, e.clientY);
                        setTooltip({ x: coords.x, y: coords.y, dayLabel: label, hour, count });
                      }}
                      onMouseMove={(e) => {
                        const coords = getTooltipPosition(e.clientX, e.clientY);
                        setTooltip((current) => updateTooltipPosition(current, coords));
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </Grid>

          {tooltip && (
            <HeatmapTooltip style={{ left: tooltip.x, top: tooltip.y }}>
              <div><b>{tooltip.dayLabel} · {formatHour(tooltip.hour)}</b></div>
              <div>{formatCount(tooltip.count)}</div>
            </HeatmapTooltip>
          )}
        </Root>
      </ChartArea>
    </ChartCard>
  );
};

export default DayHourHeatmap;
