'use client';

import React, { useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import type { BranchId, BranchSnapshot, Tier, TreeSnapshot } from '@/lib/branchTree';
import {
  IconFlame, IconRoute, IconTrendUp, IconCalendar, IconCompass, IconMountain,
} from '@/components/Icon';
import BranchWeb, { RADIUS, TIER_RINGS, polar } from './branchWeb';
import { AdnChartWrapper } from './styled';

/**
 * Las marcas del árbol sobre la telaraña compartida (`BranchWeb`): tres nodos
 * por eje, uno en cada anillo punteado. El nodo de nivel N cae en el mismo
 * punto donde el radar marca el ancla de ese nivel (25/50/100% del radio).
 *
 * Cada nodo es un `<button>` real dentro de un `foreignObject`: así se
 * reutilizan los componentes de `Icon` y el foco por teclado, y la geometría
 * sale de las mismas funciones que dibujan los anillos.
 *
 * El detalle no es un tooltip flotante sino una franja fija debajo: con 18
 * nodos en círculo, un panel posicionado se recorta o tapa a los vecinos, y el
 * texto de requisitos necesita más ancho del que hay entre dos ramas.
 */

// ── Geometría ───────────────────────────────────────────────────────────────

/**
 * Diámetro de un nodo, en unidades del viewBox. Los de nivel 1 y 2 quedan a
 * 24 y 48 unidades del centro y a ~24 de su vecino de la rama de al lado, así
 * que más de 21 se pisarían entre sí; el de nivel 3 está en el borde, donde
 * hay lugar de sobra.
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

type NodeState = 'locked' | 'unlocked' | 'peak';

const Node = styled.button<{ $state: NodeState; $active: boolean }>`
  width: 100%;
  height: 100%;
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
      transform: scale(1.14);
      border-color: var(--accent);
    `}

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
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

  const nodeState = (tier: Tier): NodeState => {
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
      <AdnChartWrapper>
        <BranchWeb branches={branches}>
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
                  <Node
                    type="button"
                    $state={nodeState(tier)}
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
                    <Ico size={tier.level === 3 ? 14 : 11} color="currentColor" />
                  </Node>
                </foreignObject>
              );
            });
          })}
        </BranchWeb>
      </AdnChartWrapper>

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
            {desbloqueados} de {n * 3} habilidades desbloqueadas. Las habilidades se desbloquean
            solas con lo que corrés. Pasá el mouse por un nodo —o tocalo— para ver cuánto llevás
            y cuánto te falta.
          </DetailHint>
        )}
      </Detail>
    </Wrap>
  );
};

export default SkillTree;
