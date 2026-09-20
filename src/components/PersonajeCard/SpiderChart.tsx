'use client';

import React from 'react';
import type { BranchSnapshot } from '@/lib/branchTree';
import BranchWeb, { RADIUS, polar } from './branchWeb';

/**
 * Las marcas del radar sobre la telaraña compartida (`BranchWeb`): un polígono
 * por eje. Cada valor es el mismo porcentaje del árbol, así que el polígono
 * dibuja literalmente hasta dónde llegaste en cada rama.
 *
 * Encima va un segundo polígono, naranja punteado: dónde quedaría el radar si
 * dejaras de correr un mes. Nunca puede ser mayor que el actual —sacar
 * actividades sólo puede bajar una métrica— así que siempre queda por dentro.
 */

interface Props {
  branches: BranchSnapshot[];
  decay?: number[];
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

  return (
    <BranchWeb branches={branches}>
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
    </BranchWeb>
  );
};

export default SpiderChart;
