'use client';

import React from 'react';
import type { BranchId, BranchSnapshot } from '@/lib/branchTree';

/**
 * La telaraña compartida por el radar y el árbol de habilidades: mismos seis
 * ejes, mismos anillos, mismas etiquetas. Lo único que cambia entre tabs es lo
 * que se dibuja ENCIMA —el polígono del radar o los nodos del árbol—, que cada
 * uno pasa como `children` de `BranchWeb`.
 *
 * Los tres anillos punteados (`TIER_RINGS`) no son decoración: caen justo en
 * 25/50/100% del radio, que son las anclas de `branchTree.ts` (`ANCHORS`). El
 * árbol pone sus tres nodos exactamente ahí (`RADIUS * TIER_RINGS[i]`), así que
 * un nodo de nivel 2 y la marca de 50% del radar son, literalmente, el mismo
 * punto del plano.
 */

export const CENTER = 150;
export const RADIUS = 95;

/**
 * El radio no crece igual que el porcentaje: crece más rápido al principio y
 * se aplana después, así un 10% y un 30% se distinguen en el dibujo en vez de
 * amontonarse los dos pegados al centro. Las anclas fijan la curva —25% cae al
 * 40% del radio, 50% al 66%, 75% al 85%, 100% al 100%— e interpola lineal
 * entre ellas.
 */
const ANCLAS_RADIO: readonly [number, number][] = [
  [0, 0],
  [0.25, 0.4],
  [0.5, 0.66],
  [0.75, 0.85],
  [1, 1],
];

export function radialFrac(f: number): number {
  const frac = Math.max(0, Math.min(1, f));
  for (let i = 1; i < ANCLAS_RADIO.length; i++) {
    const [x0, y0] = ANCLAS_RADIO[i - 1];
    const [x1, y1] = ANCLAS_RADIO[i];
    if (frac <= x1) return y0 + ((frac - x0) / (x1 - x0)) * (y1 - y0);
  }
  return 1;
}

/** Donde caen los tres niveles de una rama, ya con la curva del radio aplicada. */
export const TIER_RINGS = [radialFrac(0.25), radialFrac(0.5), radialFrac(1)] as const;
const GRID_LEVELS = 4;
/**
 * Las etiquetas viven apenas afuera del anillo exterior. Es el número que
 * limita cuánto puede crecer el radio: la más larga ("Exploración") cae a la
 * izquierda con anclaje al final, así que a más radio, más cerca queda su
 * primera letra del borde del viewBox.
 */
const LABEL_R = 110;

export function angleAt(i: number, n: number): number {
  return (Math.PI * 2 * i) / n - Math.PI / 2;
}

export function polar(r: number, i: number, n: number): [number, number] {
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

interface Props {
  branches: BranchSnapshot[];
  /** La rama que da el título de la card: su eje se destaca en dorado. */
  dominantId?: BranchId;
  /** Lo que va encima de la telaraña: el polígono del radar o los nodos del árbol. */
  children?: React.ReactNode;
}

/**
 * Sólo el esqueleto: anillos, radios y etiquetas. Sin marcas propias — esas
 * las agrega quien lo use, como `children`, para que radar y árbol compartan
 * el mismo dibujo de base y sólo difieran en qué se superpone.
 */
const BranchWeb: React.FC<Props> = ({ branches, dominantId, children }) => {
  const n = branches.length;
  const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

  return (
    <svg viewBox="0 0 300 300" style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
      {/* Anillos de fondo. Con la misma curva del radio: caen donde cae cada 25% real. */}
      {Array.from({ length: GRID_LEVELS }, (_, i) => (
        <polygon
          key={i}
          points={polygon(Array(n).fill(radialFrac((i + 1) / GRID_LEVELS)))}
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

      {/* Radios. El de la rama dominante sale dorado: es el eje que da el título. */}
      {Array.from({ length: n }, (_, i) => {
        const [x, y] = polar(RADIUS, i, n);
        const esDominante = branches[i].id === dominantId;
        return (
          <line
            key={i}
            x1={CENTER}
            y1={CENTER}
            x2={x.toFixed(2)}
            y2={y.toFixed(2)}
            stroke={esDominante ? 'rgba(var(--gold-rgb),0.45)' : 'rgba(255,255,255,0.08)'}
            strokeWidth={esDominante ? 1.5 : 1}
          />
        );
      })}

      {children}

      {/* Etiquetas: nombre de la rama + porcentaje. Arriba de las marcas, siempre legibles. */}
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

        const esDominante = b.id === dominantId;

        return (
          <React.Fragment key={b.id}>
            <text
              x={lx.toFixed(2)}
              y={labelY.toFixed(2)}
              textAnchor={anchor}
              dominantBaseline="hanging"
              fill={esDominante ? 'var(--gold)' : 'rgba(var(--text-secondary-rgb),0.85)'}
              fontSize={LABEL_H}
              fontWeight={esDominante ? '700' : '400'}
              fontFamily={font}
            >
              {b.name}
            </text>
            <text
              x={lx.toFixed(2)}
              y={(labelY + LABEL_H + 2).toFixed(2)}
              textAnchor={anchor}
              dominantBaseline="hanging"
              fill={esDominante ? 'var(--gold)' : '#e8e8f0'}
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

export default BranchWeb;
