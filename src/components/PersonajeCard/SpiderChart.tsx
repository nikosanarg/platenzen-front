'use client';

import React from 'react';
import type { AdnScores } from '@/lib/roles';

const N = 5;
const GRID_LEVELS = 4;
const CENTER_X = 130;
const CENTER_Y = 130;
const RADIUS = 76;
const LR_LABEL = 94; // label attachment distance from center

// Clockwise from top
const AXES: { key: keyof AdnScores; label: string }[] = [
  { key: 'exploracion',  label: 'Exploración' },
  { key: 'consistencia', label: 'Consistencia' },
  { key: 'velocidad',    label: 'Velocidad' },
  { key: 'resistencia',  label: 'Resistencia' },
  { key: 'logros',       label: 'Logros' },
];

function axisAngle(i: number): number {
  return (Math.PI * 2 * i) / N - Math.PI / 2;
}

function polarXY(r: number, i: number): [number, number] {
  const a = axisAngle(i);
  return [CENTER_X + Math.cos(a) * r, CENTER_Y + Math.sin(a) * r];
}

function polyPoints(fracs: number[]): string {
  return fracs.map((f, i) => {
    const [x, y] = polarXY(RADIUS * f, i);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
}

interface SpiderChartProps {
  scores: AdnScores;
}

const SpiderChart: React.FC<SpiderChartProps> = ({ scores }) => {
  const fracs = AXES.map(({ key }) => Math.max(0, Math.min(100, scores[key])) / 100);

  return (
    <svg
      viewBox="0 0 300 260"
      style={{ width: '100%', height: 'auto', display: 'block' }}
      aria-hidden
    >
      {/* Grid rings */}
      {Array.from({ length: GRID_LEVELS }, (_, i) => (
        <polygon
          key={i}
          points={polyPoints(Array(N).fill((i + 1) / GRID_LEVELS))}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />
      ))}

      {/* Axis spokes */}
      {Array.from({ length: N }, (_, i) => {
        const [x, y] = polarXY(RADIUS, i);
        return (
          <line key={i}
            x1={CENTER_X} y1={CENTER_Y}
            x2={x.toFixed(2)} y2={y.toFixed(2)}
            stroke="rgba(255,255,255,0.08)" strokeWidth={1}
          />
        );
      })}

      {/* Value polygon */}
      <polygon
        points={polyPoints(fracs)}
        fill="rgba(252,76,2,0.22)"
        stroke="#fc4c02"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />

      {/* Value dots */}
      {fracs.map((f, i) => {
        const [x, y] = polarXY(RADIUS * f, i);
        return <circle key={i} cx={x.toFixed(2)} cy={y.toFixed(2)} r={3} fill="#fc4c02" />;
      })}

      {/* Dual-line labels: name + numeric value */}
      {AXES.map(({ label, key }, i) => {
        const a = axisAngle(i);
        const [lx, ly] = polarXY(LR_LABEL, i);
        const cos = Math.cos(a);
        const sin = Math.sin(a);
        const anchor: React.SVGAttributes<SVGTextElement>['textAnchor'] =
          cos > 0.25 ? 'start' : cos < -0.25 ? 'end' : 'middle';

        const LABEL_H = 9;
        const VALUE_H = 13;
        const BLOCK_H = LABEL_H + 2 + VALUE_H;

        let labelY: number;
        if (sin < -0.5) {
          // Top axis — block sits above the anchor point
          labelY = ly - BLOCK_H - 4;
        } else if (sin > 0.3) {
          // Bottom axes — block hangs below
          labelY = ly + 4;
        } else {
          // Side axes — vertically centered
          labelY = ly - BLOCK_H / 2;
        }

        const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

        return (
          <React.Fragment key={i}>
            <text
              x={lx.toFixed(2)}
              y={labelY.toFixed(2)}
              textAnchor={anchor}
              dominantBaseline="hanging"
              fill="rgba(144,144,168,0.85)"
              fontSize={LABEL_H}
              fontFamily={font}
            >
              {label}
            </text>
            <text
              x={lx.toFixed(2)}
              y={(labelY + LABEL_H + 2).toFixed(2)}
              textAnchor={anchor}
              dominantBaseline="hanging"
              fill="#e8e8f0"
              fontSize={VALUE_H}
              fontWeight="700"
              fontFamily={font}
            >
              {scores[key]}
            </text>
          </React.Fragment>
        );
      })}
    </svg>
  );
};

export default SpiderChart;
