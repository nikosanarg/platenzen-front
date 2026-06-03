'use client';

import React, { useState } from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { RunnerDNA, RunnerDNATooltips } from '@/lib/runnerDNA';
import styled from 'styled-components';

// ── Styled components ──────────────────────────────────────────────────────

const DNASection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border);
`;

const DNASectionTitle = styled.div`
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--text-muted);
`;

const ChartWrapper = styled.div`
  width: 100%;
  height: 240px;

  @media (max-width: 600px) {
    height: 200px;
  }
`;

const DominantProfile = styled.div`
  text-align: center;
  font-size: 0.78rem;
  color: var(--text-muted);

  span {
    color: var(--accent);
    font-weight: 600;
  }
`;

const HorizontalLayout = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;

  @media (max-width: 600px) {
    flex-direction: column-reverse;
  }
`;

const ValuesCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 0 0 auto;
`;

const ChartCol = styled.div`
  flex: 1;
  min-width: 0;
`;

const AttributeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.375rem;
`;

const AttributeChip = styled.button<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
  padding: 0.375rem 0.25rem;
  background: ${({ $active }) => $active ? 'rgba(252, 76, 2, 0.1)' : 'transparent'};
  border: 1px solid ${({ $active }) => $active ? 'var(--accent)' : 'var(--border)'};
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: var(--accent);
    background: rgba(252, 76, 2, 0.08);
  }
`;

const AttributeName = styled.div`
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  text-transform: uppercase;
`;

const AttributeValue = styled.div<{ $value: number }>`
  font-size: 0.85rem;
  font-weight: 700;
  color: ${({ $value }) =>
    $value >= 70 ? '#4ade80' :
    $value >= 40 ? 'var(--accent)' :
    'var(--text-muted)'};
`;

const TooltipBox = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.75rem 0.875rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.6;
  max-width: 260px;
  white-space: pre-line;
`;

// ── Custom tooltip for recharts ────────────────────────────────────────────

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { subject: string; tooltip: string } }>;
}

const CustomRadarTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const { tooltip } = payload[0].payload;
  return <TooltipBox>{tooltip}</TooltipBox>;
};

// ── Main component ─────────────────────────────────────────────────────────

const ATTR_LABELS: Record<keyof RunnerDNA, string> = {
  resistencia: 'Resistencia',
  velocidad: 'Velocidad',
  consistencia: 'Consistencia',
  exploracion: 'Exploración',
  logros: 'Logros',
};

interface RunnerDNAChartProps {
  dna: RunnerDNA;
  tooltips: RunnerDNATooltips;
  dominantRoleName: string;
}

const RunnerDNAChart: React.FC<RunnerDNAChartProps> = ({ dna, tooltips, dominantRoleName }) => {
  const [activeAttr, setActiveAttr] = useState<keyof RunnerDNA | null>(null);

  const data = (Object.keys(ATTR_LABELS) as (keyof RunnerDNA)[]).map(key => ({
    subject: ATTR_LABELS[key],
    value: dna[key],
    fullMark: 100,
    tooltip: tooltips[key],
  }));

  return (
    <DNASection>
      <DNASectionTitle>ADN del Corredor</DNASectionTitle>

      <HorizontalLayout>
        <ValuesCol>
          <AttributeGrid>
            {(Object.keys(ATTR_LABELS) as (keyof RunnerDNA)[]).map(key => (
              <AttributeChip
                key={key}
                $active={activeAttr === key}
                onClick={() => setActiveAttr(activeAttr === key ? null : key)}
                title={tooltips[key]}
              >
                <AttributeName>{ATTR_LABELS[key]}</AttributeName>
                <AttributeValue $value={dna[key]}>{dna[key]}</AttributeValue>
              </AttributeChip>
            ))}
          </AttributeGrid>

          <DominantProfile>
            Perfil dominante: <span>{dominantRoleName}</span>
          </DominantProfile>
        </ValuesCol>

        <ChartCol>
          <ChartWrapper>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                <PolarGrid
                  stroke="var(--border)"
                  strokeOpacity={0.6}
                />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}
                />
                <Radar
                  name="ADN"
                  dataKey="value"
                  stroke="var(--accent)"
                  fill="var(--accent)"
                  fillOpacity={0.2}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
                <Tooltip content={<CustomRadarTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </ChartCol>
      </HorizontalLayout>

      {activeAttr && (
        <TooltipBox>{tooltips[activeAttr]}</TooltipBox>
      )}
    </DNASection>
  );
};

export default RunnerDNAChart;
