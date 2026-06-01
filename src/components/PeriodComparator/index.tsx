'use client';

import React, { useState } from 'react';
import { StravaActivity } from '@/types/strava';
import {
  computePeriodComparisons,
  PeriodType,
  pctChange,
  formatPaceSec,
  formatTimeSec,
} from '@/lib/periodComparison';
import { SectionTitle } from '@/components/Dashboard/styled';
import {
  ComparatorRoot,
  TabsRow,
  TabBtn,
  CompareTable,
  TableHeader,
  ColHead,
  TableRow,
  MetricName,
  CombinedCell,
  BeforeValue,
  VsText,
  AfterValue,
  DeltaBadge,
  ConclusionBox,
} from './styled';

interface PeriodComparatorProps {
  activities: StravaActivity[];
}

interface MetricRow {
  name: string;
  current: string;
  previous: string;
  delta: number | null;
  positiveIsGood: boolean;
}

const PERIOD_LABELS: Record<PeriodType, string> = {
  '30d': '30 días',
  '90d': '90 días',
  year: 'Este año',
};

const PeriodComparator: React.FC<PeriodComparatorProps> = ({ activities }) => {
  const [activePeriod, setActivePeriod] = useState<PeriodType>('30d');
  const comparisons = computePeriodComparisons(activities);
  const comp = comparisons.find(c => c.period === activePeriod)!;

  const paceDelta = (() => {
    if (comp.current.avgPaceSec === 0 || comp.previous.avgPaceSec === 0) return null;
    return comp.previous.avgPaceSec - comp.current.avgPaceSec; // positive = improvement
  })();

  const rows: MetricRow[] = [
    {
      name: 'Distancia',
      current: `${comp.current.distanceKm} km`,
      previous: `${comp.previous.distanceKm} km`,
      delta: pctChange(comp.current.distanceKm, comp.previous.distanceKm),
      positiveIsGood: true,
    },
    {
      name: 'Actividades',
      current: String(comp.current.activities),
      previous: String(comp.previous.activities),
      delta: pctChange(comp.current.activities, comp.previous.activities),
      positiveIsGood: true,
    },
    {
      name: 'Ritmo prom.',
      current: formatPaceSec(comp.current.avgPaceSec),
      previous: formatPaceSec(comp.previous.avgPaceSec),
      delta: paceDelta !== null ? Math.round(paceDelta) : null,
      positiveIsGood: true,
    },
    {
      name: 'Tiempo total',
      current: formatTimeSec(comp.current.totalTimeSec),
      previous: formatTimeSec(comp.previous.totalTimeSec),
      delta: pctChange(comp.current.totalTimeSec, comp.previous.totalTimeSec),
      positiveIsGood: true,
    },
    {
      name: 'Tiempo / actividad',
      current: formatTimeSec(comp.current.avgTimePerActivitySec),
      previous: formatTimeSec(comp.previous.avgTimePerActivitySec),
      delta: pctChange(comp.current.avgTimePerActivitySec, comp.previous.avgTimePerActivitySec),
      positiveIsGood: true,
    },
  ];

  function formatDelta(row: MetricRow): string {
    if (row.delta === null) return '—';
    if (row.name === 'Ritmo prom.') {
      if (row.delta === 0) return '=';
      const abs = Math.abs(row.delta);
      const sign = row.delta > 0 ? '+' : '−';
      return `${sign}${abs}"`;
    }
    const sign = row.delta > 0 ? '+' : '';
    return `${sign}${row.delta}%`;
  }

  function getPositive(row: MetricRow): boolean | null {
    if (row.delta === null || row.delta === 0) return null;
    return row.positiveIsGood ? row.delta > 0 : row.delta < 0;
  }

  function buildConclusion(): string | null {
    const distRow = rows.find(r => r.name === 'Distancia');
    const actRow = rows.find(r => r.name === 'Actividades');
    const paceRow = rows.find(r => r.name === 'Ritmo prom.');

    if (!distRow || distRow.delta === null) return null;

    const parts: string[] = [];
    const distDelta = distRow.delta;
    const actDelta = actRow?.delta ?? null;
    const pd = paceRow?.delta ?? null;

    if (Math.abs(distDelta) <= 5 && actDelta !== null && actDelta < -5) {
      parts.push(
        `Corriste prácticamente la misma distancia que el período anterior, pero en menos actividades, lo que sugiere salidas más largas.`
      );
    } else if (distDelta >= 15) {
      parts.push(`Corriste un ${distDelta}% más de distancia que el período anterior.`);
    } else if (distDelta <= -15) {
      parts.push(`Corriste un ${Math.abs(distDelta)}% menos de distancia que el período anterior.`);
    } else if (distDelta > 0) {
      parts.push(`Mantuviste un volumen similar al período anterior con una leve mejora del ${distDelta}%.`);
    }

    if (pd !== null && Math.abs(pd) >= 5) {
      const dir = pd > 0 ? 'mejoró' : 'bajó';
      parts.push(`Tu ritmo promedio ${dir} ${Math.abs(pd)} segundos/km respecto al período anterior.`);
    }

    if (actDelta !== null && actDelta > 15 && distDelta < 5) {
      parts.push(`Más salidas en menos distancia total indica entrenamientos más cortos o mayor frecuencia de recuperación.`);
    }

    return parts.length > 0 ? parts.join(' ') : null;
  }

  const conclusion = buildConclusion();

  return (
    <ComparatorRoot>
      <SectionTitle>Períodos</SectionTitle>

      <TabsRow>
        {(['30d', '90d', 'year'] as PeriodType[]).map(p => (
          <TabBtn key={p} $active={activePeriod === p} onClick={() => setActivePeriod(p)}>
            {PERIOD_LABELS[p]}
          </TabBtn>
        ))}
      </TabsRow>

      <CompareTable>
        <TableHeader>
          <ColHead>Métrica</ColHead>
          <ColHead>Antes vs. Ahora</ColHead>
          <ColHead>Cambio</ColHead>
        </TableHeader>

        {rows.map(row => {
          const pos = getPositive(row);
          return (
            <TableRow key={row.name}>
              <MetricName>{row.name}</MetricName>
              <CombinedCell>
                <BeforeValue $positive={pos}>{row.previous}</BeforeValue>
                <VsText>vs.</VsText>
                <AfterValue $positive={pos}>{row.current}</AfterValue>
              </CombinedCell>
              <DeltaBadge $positive={pos}>{formatDelta(row)}</DeltaBadge>
            </TableRow>
          );
        })}
      </CompareTable>

      {conclusion && <ConclusionBox>{conclusion}</ConclusionBox>}
    </ComparatorRoot>
  );
};

export default PeriodComparator;
