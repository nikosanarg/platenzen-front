'use client';

import React from 'react';
import type { BranchSnapshot } from '@/lib/branchTree';

/**
 * El radar de seis ejes. Cada eje es una rama del árbol y su valor es el mismo
 * porcentaje, así que el polígono dibuja literalmente hasta dónde llegaste en
 * cada rama.
 *
 * Encima va un segundo polígono, naranja punteado: dónde quedaría el radar si
 * dejaras de correr un mes. Nunca puede ser mayor que el actual —sacar
 * actividades sólo puede bajar una métrica— así que siempre queda por dentro.
 */

const GRID_LEVELS = 4;
const CENTER = 150;
const RADIUS = 95;
/**
 * Las etiquetas viven apenas afuera del anillo exterior. Es el número que
 * limita cuánto puede crecer el radar: la más larga ("Exploración") cae a la
 * izquierda con anclaje al final, así que a más radio, más cerca queda su
 * primera letra del borde del viewBox.
 */
const LABEL_R = 110;

/** Los anillos donde caen los niveles. Coinciden con las anclas de la escala. */
const TIER_RINGS = [0.25, 0.5, 1];

interface Props {
  branches: BranchSnapshot[];
  decay?: number[];
}

function angleAt(i: number, n: number): number {
  return (Math.PI * 2 * i) / n - Math.PI / 2;
}

function polar(r: number, i: number, n: number): [number, number] {
  const a = angleAt(i, n);
  return [CENTER + Math.cos(a) * r, CENTER + Math.sin(a) * r];
}

function polygon(fracs: number[]): string {
  return fracs
    .map((f, i) => {
      const [x, y] = polar(RADIUS * Math.max(0, Math.min(1, f)), i, fracs.length);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

const SpiderChart: React.FC<Props> = ({ branches, decay }) => {
  const n = branches.length;
  const fracs = branches.map(b => b.pct / 100);
  const decayFracs = decay?.map(p => p / 100);

  const hayCaida =
    decayFracs !== undefined && decayFracs.some((d, i) => fracs[i] - d > 0.005);

  const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

  return (
    <svg viewBox="0 0 300 300" style={{ width: '100%', height: 'auto', display: 'block' }} aria-hidden>
      {/* Anillos de fondo */}
      {Array.from({ length: GRID_LEVELS }, (_, i) => (
        <polygon
          key={i}
          points={polygon(Array(n).fill((i + 1) / GRID_LEVELS))}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={1}
        />
      ))}

      {/* Anillos de nivel: marcan dónde cae cada tier */}
      {TIER_RINGS.map((r, i) => (
        <polygon
          key={`tier-${i}`}
          points={polygon(Array(n).fill(r))}
          fill="none"
          stroke="rgba(255,255,255,0.13)"
          strokeWidth={1}
          strokeDasharray="2 3"
        />
      ))}

      {/* Radios */}
      {Array.from({ length: n }, (_, i) => {
        const [x, y] = polar(RADIUS, i, n);
        return (
          <line
            key={i}
            x1={CENTER}
            y1={CENTER}
            x2={x.toFixed(2)}
            y2={y.toFixed(2)}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
          />
        );
      })}

      {/* Proyección de decaimiento */}
      {hayCaida && (
        <polygon
          points={polygon(decayFracs!)}
          fill="rgba(239,68,68,0.10)"
          stroke="#ef4444"
          strokeWidth={1.25}
          strokeDasharray="4 3"
          strokeLinejoin="round"
        />
      )}

      {/* Estado actual */}
      <polygon
        points={polygon(fracs)}
        fill="rgba(var(--accent-rgb),0.20)"
        stroke="var(--accent)"
        strokeWidth={1.75}
        strokeLinejoin="round"
      />

      {fracs.map((f, i) => {
        const [x, y] = polar(RADIUS * Math.max(0, Math.min(1, f)), i, n);
        return <circle key={i} cx={x.toFixed(2)} cy={y.toFixed(2)} r={3} fill="var(--accent)" />;
      })}

      {/* Etiquetas: nombre de la rama + porcentaje */}
      {branches.map((b, i) => {
        const a = angleAt(i, n);
        const [lx, ly] = polar(LABEL_R, i, n);
        const cos = Math.cos(a);
        const sin = Math.sin(a);
        const anchor: React.SVGAttributes<SVGTextElement>['textAnchor'] =
          cos > 0.25 ? 'start' : cos < -0.25 ? 'end' : 'middle';

        const LABEL_H = 9;
        const VALUE_H = 12;
        const BLOCK_H = LABEL_H + 2 + VALUE_H;

        const labelY =
          sin < -0.5 ? ly - BLOCK_H - 3 : sin > 0.3 ? ly + 3 : ly - BLOCK_H / 2;

        return (
          <React.Fragment key={b.id}>
            <text
              x={lx.toFixed(2)}
              y={labelY.toFixed(2)}
              textAnchor={anchor}
              dominantBaseline="hanging"
              fill="rgba(var(--text-secondary-rgb),0.85)"
              fontSize={LABEL_H}
              fontFamily={font}
            >
              {b.name}
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
              {Math.round(b.pct)}%
            </text>
          </React.Fragment>
        );
      })}
    </svg>
  );
};

export default SpiderChart;
