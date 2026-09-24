'use client';

import React, { useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Badge } from 'kaizen-lib/ui';
import type { BranchId, BranchSnapshot, Tier, TreeSnapshot } from '@/lib/branchTree';
import { DIAS_DECAIMIENTO } from '@/lib/branchTree';
import {
  IconFlame, IconRoute, IconTrendUp, IconCalendar, IconCompass, IconMountain,
} from '@/components/Icon';
import BranchWeb, { RADIUS, TIER_RINGS, polar, radialFrac } from './branchWeb';

/**
 * Radar y árbol dejaron de ser dos pestañas: son una sola lectura. El polígono
 * pintado (cuánto avanzaste) y los nodos del árbol (qué desbloqueaste en el
 * camino) son el mismo cálculo de `branchTree`, así que van superpuestos sobre
 * la misma telaraña en vez de competir por turno.
 *
 * El detalle de un nodo ya no vive en una franja fija debajo —eso reservaba
 * alto aunque nadie estuviera mirando nada— sino en un tooltip flotante
 * anclado al nodo, que sólo ocupa espacio cuando hay algo que mostrar.
 */

const NODE_SIZE = [20, 20, 25];

const ICONS: Record<BranchId, React.FC<{ size?: number; color?: string }>> = {
  resistencia: IconFlame,
  fondo: IconRoute,
  velocidad: IconTrendUp,
  consistencia: IconCalendar,
  exploracion: IconCompass,
  desnivel: IconMountain,
};

// ── Estilos ─────────────────────────────────────────────────────────────────

const latido = keyframes`
  0%, 100% { box-shadow: 0 0 0 rgba(var(--accent-rgb), 0.30); }
  50%      { box-shadow: 0 0 9px 1px rgba(var(--accent-rgb), 0.42); }
`;

const Wrap = styled.div`
  position: relative;
  width: 100%;
`;

type NodeState = 'locked' | 'unlocked' | 'peak';

const NodeBtn = styled.button<{ $state: NodeState; $active: boolean; $dominant: boolean }>`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.15s ease;

  background: ${({ $state, $dominant }) =>
    $state === 'locked'
      ? 'var(--bg-secondary)'
      : $dominant
      ? 'rgba(var(--gold-rgb), 0.20)'
      : 'var(--accent-muted)'};
  border: 1.5px solid
    ${({ $state, $dominant }) =>
      $state === 'locked'
        ? 'var(--border)'
        : $dominant
        ? 'var(--gold)'
        : $state === 'peak'
        ? 'var(--accent)'
        : 'rgba(var(--accent-rgb), 0.45)'};
  color: ${({ $state, $dominant }) =>
    $state === 'locked' ? 'var(--text-muted)' : $dominant ? 'var(--gold)' : 'var(--accent)'};

  ${({ $state }) =>
    $state === 'peak' &&
    css`
      animation: ${latido} 2.6s ease-in-out infinite;
    `}

  ${({ $active }) =>
    $active &&
    css`
      transform: scale(1.14);
      border-color: var(--accent);
    `}

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
`;

/**
 * `left`/`top` llegan como el mismo % que usa el nodo (coordenadas del
 * viewBox sobre 300, que es cuadrado): el wrapper que la contiene es
 * cuadrado por el mismo motivo, así que un % de x y un % de y caen en el
 * punto exacto sin medir píxeles reales del layout.
 */
const TooltipBox = styled.div<{ $left: number; $top: number; $flip: 'up' | 'down'; $anchor: 'start' | 'middle' | 'end' }>`
  position: absolute;
  left: ${({ $left }) => $left}%;
  top: ${({ $top }) => $top}%;
  transform: translate(
    ${({ $anchor }) => ($anchor === 'start' ? '0%' : $anchor === 'end' ? '-100%' : '-50%')},
    ${({ $flip }) => ($flip === 'up' ? 'calc(-100% - 10px)' : '10px')}
  );
  z-index: 5;
  width: 210px;
  max-width: 60vw;
  background: rgba(12, 14, 20, 0.97);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.65rem 0.75rem;
  pointer-events: none;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
`;

const TooltipHead = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-bottom: 0.4rem;
`;

const TooltipTier = styled.span`
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--text-primary);
`;

const TooltipBranch = styled.span`
  font-size: 0.64rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
`;

const ReqRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.68rem;
  padding: 0.12rem 0;
`;

const ReqLabel = styled.span<{ $met: boolean }>`
  color: ${({ $met }) => ($met ? 'var(--success)' : 'var(--text-secondary)')};
  min-width: 0;
`;

const ReqValue = styled.span`
  color: var(--text-muted);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
`;

const ReqStrong = styled.strong`
  color: var(--text-primary);
  font-weight: 700;
`;

/** Contenido del tooltip que explica el gráfico, al hacer hover en el área pintada. */
const HelpList = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const HelpItem = styled.li`
  font-size: 0.68rem;
  color: var(--text-secondary);
  line-height: 1.4;
  padding-left: 0.85rem;
  position: relative;

  &::before {
    content: '·';
    position: absolute;
    left: 0;
    color: var(--text-muted);
    font-weight: 700;
  }
`;

function polygon(fracs: number[]): string {
  return fracs
    .map((f, i) => {
      const [x, y] = polar(RADIUS * radialFrac(f), i, fracs.length);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

interface Selected {
  branch: BranchSnapshot;
  tier: Tier;
  x: number;
  y: number;
}

interface Props {
  tree: TreeSnapshot;
  decay?: number[];
  /** La rama que da el título de la card: su eje sale dorado en la telaraña. */
  dominantId?: BranchId;
}

const BranchProfile: React.FC<Props> = ({ tree, decay, dominantId }) => {
  const [hovered, setHovered] = useState<Selected | null>(null);
  const [pinned, setPinned] = useState<Selected | null>(null);
  const [areaHover, setAreaHover] = useState(false);
  const active = pinned ?? hovered;

  const { branches, maxLevel } = tree;
  const n = branches.length;

  const fracs = branches.map(b => b.pct / 100);
  const decayFracs = decay?.map(p => p / 100);
  const hayCaida = decayFracs !== undefined && decayFracs.some((d, i) => fracs[i] - d > 0.005);

  const nodeState = (tier: Tier): NodeState => {
    if (!tier.unlocked) return 'locked';
    return tier.level === maxLevel ? 'peak' : 'unlocked';
  };

  const toggle = (sel: Selected) => {
    setPinned(prev =>
      prev && prev.branch.id === sel.branch.id && prev.tier.level === sel.tier.level ? null : sel,
    );
  };

  const CENTER = 150;

  return (
    <Wrap>
      <BranchWeb branches={branches} dominantId={dominantId}>
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

        {/* Estado actual: la superficie pintada. Hover/foco explica el gráfico. */}
        <polygon
          points={polygon(fracs)}
          fill="rgba(var(--accent-rgb),0.20)"
          stroke="var(--accent)"
          strokeWidth={1.75}
          strokeLinejoin="round"
          tabIndex={0}
          role="img"
          aria-label="Cómo leer este gráfico"
          style={{ cursor: 'help' }}
          onMouseEnter={() => setAreaHover(true)}
          onMouseLeave={() => setAreaHover(false)}
          onFocus={() => setAreaHover(true)}
          onBlur={() => setAreaHover(false)}
        />

        {/* Los nodos del árbol, encima de la superficie */}
        {branches.map((branch, i) => {
          const Ico = ICONS[branch.id];
          return branch.tiers.map(tier => {
            const size = NODE_SIZE[tier.level - 1];
            const [x, y] = polar(RADIUS * TIER_RINGS[tier.level - 1], i, n);
            const isActive =
              !!active && active.branch.id === branch.id && active.tier.level === tier.level;
            return (
              <foreignObject
                key={`${branch.id}-${tier.level}`}
                x={(x - size / 2).toFixed(2)}
                y={(y - size / 2).toFixed(2)}
                width={size}
                height={size}
                style={{ overflow: 'visible' }}
              >
                <NodeBtn
                  type="button"
                  $state={nodeState(tier)}
                  $active={isActive}
                  $dominant={branch.id === dominantId}
                  aria-label={`${branch.name} · ${tier.name}, nivel ${tier.level}${
                    tier.unlocked ? ', desbloqueado' : ''
                  }`}
                  onMouseEnter={() => setHovered({ branch, tier, x, y })}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered({ branch, tier, x, y })}
                  onBlur={() => setHovered(null)}
                  onClick={() => toggle({ branch, tier, x, y })}
                >
                  <Ico size={tier.level === 3 ? 14 : 11} color="currentColor" />
                </NodeBtn>
              </foreignObject>
            );
          });
        })}
      </BranchWeb>

      {active && (
        <TooltipBox
          role="status"
          $left={(active.x / 300) * 100}
          $top={(active.y / 300) * 100}
          $flip={active.y < CENTER ? 'down' : 'up'}
          $anchor={active.x < CENTER - 30 ? 'start' : active.x > CENTER + 30 ? 'end' : 'middle'}
        >
          <TooltipHead>
            <TooltipTier>{active.tier.name}</TooltipTier>
            <TooltipBranch>
              {active.branch.name} · nivel {active.tier.level}
            </TooltipBranch>
            <Badge tone={active.tier.unlocked ? 'success' : 'neutral'}>
              {active.tier.unlocked ? 'Desbloqueado' : 'Pendiente'}
            </Badge>
          </TooltipHead>
          {active.tier.requirements.map(r => (
            <ReqRow key={r.label}>
              <ReqLabel $met={r.met}>
                {r.met ? '✓' : '·'} {r.label}
              </ReqLabel>
              <ReqValue>
                <ReqStrong>{r.display}</ReqStrong> / {r.targetDisplay}
              </ReqValue>
            </ReqRow>
          ))}
        </TooltipBox>
      )}

      {!active && areaHover && (
        <TooltipBox role="status" $left={50} $top={88} $flip="down" $anchor="middle">
          <TooltipHead>
            <TooltipTier>Cómo leer este gráfico</TooltipTier>
          </TooltipHead>
          <HelpList>
            <HelpItem>El área pintada es tu nivel actual en cada rama, sobre 100%.</HelpItem>
            <HelpItem>El eje dorado es la rama que te da el título de arriba.</HelpItem>
            <HelpItem>
              {hayCaida
                ? `La línea punteada roja muestra dónde quedarías si dejás de correr ${DIAS_DECAIMIENTO} días.`
                : 'Tu progreso no vence en el próximo mes: nada decae todavía.'}
            </HelpItem>
          </HelpList>
        </TooltipBox>
      )}
    </Wrap>
  );
};

export default BranchProfile;
