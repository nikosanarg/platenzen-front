'use client';

import React, { useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import type { BranchId, BranchSnapshot, Tier, TreeSnapshot } from '@/lib/branchTree';
import {
  IconFlame, IconRoute, IconTrendUp, IconCalendar, IconCompass, IconMountain,
} from '@/components/Icon';

/**
 * El árbol de habilidades: seis ramas saliendo del centro, tres nodos cada una.
 *
 * Los nodos van en HTML absoluto sobre un SVG que dibuja sólo los radios. Se
 * podría hacer todo en SVG, pero entonces los íconos y el foco por teclado
 * habría que reimplementarlos — así se reutilizan los componentes de `Icon` y
 * cada nodo es un `<button>` de verdad.
 *
 * El detalle no es un tooltip flotante sino una franja fija debajo: con 18
 * nodos en círculo, un panel posicionado se recorta o tapa a los vecinos, y el
 * texto de requisitos necesita más ancho del que hay entre dos ramas.
 */

// ── Geometría ───────────────────────────────────────────────────────────────

/** Radios de cada nivel, en % del contenedor desde el centro. */
const NODE_R = [13, 25, 37];
const LABEL_R = 46;

const ICONS: Record<BranchId, React.FC<{ size?: number; color?: string }>> = {
  resistencia: IconFlame,
  fondo: IconRoute,
  velocidad: IconTrendUp,
  consistencia: IconCalendar,
  exploracion: IconCompass,
  desnivel: IconMountain,
};

function angleAt(i: number, n: number): number {
  return (Math.PI * 2 * i) / n - Math.PI / 2;
}

/** Posición en % (left, top) a `r` % del centro, para el ángulo de la rama `i`. */
function pos(r: number, i: number, n: number): { left: string; top: string } {
  const a = angleAt(i, n);
  return {
    left: `${(50 + Math.cos(a) * r).toFixed(3)}%`,
    top: `${(50 + Math.sin(a) * r).toFixed(3)}%`,
  };
}

// ── Estilos ─────────────────────────────────────────────────────────────────

/**
 * Latido deliberadamente corto de amplitud: el glow de logros recién
 * desbloqueados (`AchievementShowcase`) gira y titila fuerte porque es un
 * evento puntual. Acá hay hasta seis nodos brillando de forma permanente, así
 * que un pulso igual de marcado convertiría la card en un arbolito de navidad.
 */
const latido = keyframes`
  0%, 100% { box-shadow: 0 0 0 rgba(var(--accent-rgb), 0.30); }
  50%      { box-shadow: 0 0 9px 1px rgba(var(--accent-rgb), 0.42); }
`;

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  width: 100%;
`;

const Board = styled.div`
  position: relative;
  width: 100%;
  max-width: 320px;
  aspect-ratio: 1;
  margin: 0 auto;
  /* Las etiquetas de rama viven fuera del círculo y necesitan asomarse. */
  overflow: visible;
`;

const Spokes = styled.svg`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

type NodeState = 'locked' | 'unlocked' | 'peak';

const Node = styled.button<{ $state: NodeState; $active: boolean }>`
  position: absolute;
  transform: translate(-50%, -50%);
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.15s ease;

  background: ${({ $state }) =>
    $state === 'locked' ? 'var(--bg-secondary)' : 'var(--accent-muted)'};
  border: 1.5px solid
    ${({ $state }) =>
      $state === 'locked'
        ? 'var(--border)'
        : $state === 'peak'
        ? 'var(--accent)'
        : 'rgba(var(--accent-rgb), 0.45)'};
  color: ${({ $state }) => ($state === 'locked' ? 'var(--text-muted)' : 'var(--accent)')};

  ${({ $state }) =>
    $state === 'peak' &&
    css`
      animation: ${latido} 2.6s ease-in-out infinite;
    `}

  ${({ $active }) =>
    $active &&
    css`
      transform: translate(-50%, -50%) scale(1.14);
      border-color: var(--accent);
    `}

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
`;

const CenterNode = styled.div`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 46px;
  height: 46px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: 1.5px solid var(--border);
  text-align: center;
  line-height: 1;
`;

const CenterValue = styled.span`
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--text-secondary);
`;

const CenterLabel = styled.span`
  font-size: 0.48rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin-top: 2px;
`;

const BranchLabel = styled.span<{ $reached: boolean }>`
  position: absolute;
  transform: translate(-50%, -50%);
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
  pointer-events: none;
  color: ${({ $reached }) => ($reached ? 'var(--text-secondary)' : 'var(--text-muted)')};
`;

const Detail = styled.div`
  border-top: 1px solid var(--border);
  padding-top: 0.8rem;
  min-height: 86px;
`;

const DetailHint = styled.div`
  font-size: 0.72rem;
  color: var(--text-muted);
  line-height: 1.5;
`;

const DetailHead = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.45rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
`;

const DetailTier = styled.span`
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--text-primary);
`;

const DetailBranch = styled.span`
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-muted);
`;

const DetailBadge = styled.span<{ $unlocked: boolean }>`
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  color: ${({ $unlocked }) => ($unlocked ? 'var(--success)' : 'var(--text-muted)')};
  background: ${({ $unlocked }) =>
    $unlocked ? 'rgba(var(--success-rgb), 0.12)' : 'var(--bg-secondary)'};
`;

const ReqRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.6rem;
  font-size: 0.72rem;
  padding: 0.16rem 0;
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

// ── Componente ──────────────────────────────────────────────────────────────

interface Selected {
  branch: BranchSnapshot;
  tier: Tier;
}

interface Props {
  tree: TreeSnapshot;
}

const SkillTree: React.FC<Props> = ({ tree }) => {
  const [hovered, setHovered] = useState<Selected | null>(null);
  const [pinned, setPinned] = useState<Selected | null>(null);
  const active = pinned ?? hovered;

  const { branches, maxLevel } = tree;
  const n = branches.length;
  const desbloqueados = branches.reduce((s, b) => s + b.level, 0);

  const nodeState = (branch: BranchSnapshot, tier: Tier): NodeState => {
    if (!tier.unlocked) return 'locked';
    return tier.level === maxLevel ? 'peak' : 'unlocked';
  };

  const toggle = (sel: Selected) => {
    setPinned(prev =>
      prev && prev.branch.id === sel.branch.id && prev.tier.level === sel.tier.level ? null : sel,
    );
  };

  return (
    <Wrap>
      <Board>
        <Spokes viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          {branches.map((branch, i) => {
            const a = angleAt(i, n);
            const cos = Math.cos(a);
            const sin = Math.sin(a);
            const points = [0, ...NODE_R].map(r => ({
              x: 50 + cos * r,
              y: 50 + sin * r,
            }));

            return points.slice(0, -1).map((p, seg) => {
              const q = points[seg + 1];
              const reached = branch.level >= seg + 1;
              return (
                <line
                  key={`${branch.id}-${seg}`}
                  x1={p.x.toFixed(2)}
                  y1={p.y.toFixed(2)}
                  x2={q.x.toFixed(2)}
                  y2={q.y.toFixed(2)}
                  stroke={reached ? 'rgba(var(--accent-rgb), 0.55)' : 'var(--border)'}
                  strokeWidth={reached ? 1.1 : 0.8}
                  vectorEffect="non-scaling-stroke"
                />
              );
            });
          })}
        </Spokes>

        <CenterNode>
          <CenterValue>{desbloqueados}</CenterValue>
          <CenterLabel>de 18</CenterLabel>
        </CenterNode>

        {branches.map((branch, i) => {
          const Ico = ICONS[branch.id];
          return (
            <React.Fragment key={branch.id}>
              {branch.tiers.map(tier => {
                const state = nodeState(branch, tier);
                const isActive =
                  !!active && active.branch.id === branch.id && active.tier.level === tier.level;
                return (
                  <Node
                    key={tier.level}
                    type="button"
                    style={pos(NODE_R[tier.level - 1], i, n)}
                    $state={state}
                    $active={isActive}
                    aria-label={`${branch.name} · ${tier.name}, nivel ${tier.level}${
                      tier.unlocked ? ', desbloqueado' : ''
                    }`}
                    onMouseEnter={() => setHovered({ branch, tier })}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered({ branch, tier })}
                    onBlur={() => setHovered(null)}
                    onClick={() => toggle({ branch, tier })}
                  >
                    <Ico size={tier.level === 3 ? 17 : 15} color="currentColor" />
                  </Node>
                );
              })}

              <BranchLabel style={pos(LABEL_R, i, n)} $reached={branch.level > 0}>
                {branch.name}
              </BranchLabel>
            </React.Fragment>
          );
        })}
      </Board>

      <Detail>
        {active ? (
          <>
            <DetailHead>
              <DetailTier>{active.tier.name}</DetailTier>
              <DetailBranch>
                {active.branch.name} · nivel {active.tier.level}
              </DetailBranch>
              <DetailBadge $unlocked={active.tier.unlocked}>
                {active.tier.unlocked ? 'Desbloqueado' : 'Pendiente'}
              </DetailBadge>
            </DetailHead>
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
          </>
        ) : (
          <DetailHint>
            Las habilidades se desbloquean solas con lo que corrés. Pasá el mouse por un nodo
            —o tocalo— para ver cuánto llevás y cuánto te falta.
          </DetailHint>
        )}
      </Detail>
    </Wrap>
  );
};

export default SkillTree;
