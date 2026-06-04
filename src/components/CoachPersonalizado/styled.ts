import styled from 'styled-components';
import { FormState } from '@/lib/formShape';

export const CoachRoot = styled.section``;

export const UnifiedCard = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const CardSection = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  & + & {
    border-top: 1px solid var(--border);
  }
`;

export const CoachBannerSection = styled(CardSection)`
  position: relative;
  isolation: isolate;

  /* Background image — reduced blur and opacity */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -2;
    background: url('/assets/coach_banner_background.png') center / cover no-repeat;
    opacity: 0.35;
    filter: blur(2px);
    border-radius: inherit;
    pointer-events: none;
  }

  /* Dark gradient overlay for legibility */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: linear-gradient(
      to right,
      rgba(0, 0, 0, 0.75) 0%,
      rgba(0, 0, 0, 0.55) 55%,
      rgba(0, 0, 0, 0.25) 100%
    );
    border-radius: inherit;
    pointer-events: none;
  }
`;

/* ── Coach block ─────────────────────────────────────────────── */

export const CoachBodyRow = styled.div`
  position: relative;
`;

export const CoachBodyLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const CoachImage = styled.img`
  position: absolute;
  top: 0;
  right: 0;
  height: 240px;
  object-fit: cover;
  pointer-events: none;
  z-index: 1;
  -webkit-mask-image: linear-gradient(to bottom, black 75%, transparent 100%);
  mask-image: linear-gradient(to bottom, black 75%, transparent 100%);

  @media (max-width: 639px) {
    display: none;
  }

  @media (min-width: 1200px) {
    height: 300px;
  }
`;

export const CoachHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const CoachIcon = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--accent-muted);
  border: 1px solid rgba(252, 76, 2, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.2rem;
  flex-shrink: 0;
`;

export const CoachHeadText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
`;

export const LoadStateLabel = styled.div`
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--text-muted);
  text-shadow: 0 1px 6px rgba(0,0,0,1), 0 0 16px rgba(0,0,0,0.9);
`;

export const RecommendationLabel = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: var(--accent);
  text-shadow: 0 1px 8px rgba(0,0,0,1), 0 0 20px rgba(0,0,0,0.9);
`;

export const MotivoBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const MotivoLine = styled.div`
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
  text-shadow: 0 1px 6px rgba(0,0,0,1), 0 0 14px rgba(0,0,0,0.9);
`;

/* ── Tooltip ─────────────────────────────────────────────────── */

export const TooltipWrapper = styled.div`
  position: relative;
  display: inline-flex;
`;

export const TooltipTrigger = styled.button`
  background: none;
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0.3rem 0.75rem;
  font-size: 0.7rem;
  color: var(--text-muted);
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;

  &:hover {
    border-color: var(--border-light);
    color: var(--text-secondary);
  }
`;

export const TooltipPopup = styled.div<{ $visible: boolean }>`
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  z-index: 200;
  min-width: 280px;
  max-width: 340px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  padding: 1rem;
  display: ${({ $visible }) => ($visible ? 'flex' : 'none')};
  flex-direction: column;
  gap: 0.5rem;
  box-shadow: var(--shadow);

  @media (max-width: 600px) {
    left: auto;
    right: 0;
    min-width: 260px;
  }
`;

export const TooltipTitle = styled.div`
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 0.125rem;
`;

export const TooltipRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem;
  font-size: 0.78rem;
`;

export const TooltipKey = styled.span`
  color: var(--text-secondary);
`;

export const TooltipVal = styled.span`
  color: var(--text-primary);
  font-weight: 600;
  text-align: right;
`;

/* ── EstadoForma inline ──────────────────────────────────────── */

export const FormaHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

export const StateBadge = styled.div<{ $state: FormState }>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: ${({ $state }) =>
    $state === 'ascenso'
      ? 'rgba(34, 197, 94, 0.12)'
      : $state === 'descenso'
      ? 'rgba(245, 158, 11, 0.12)'
      : 'rgba(144, 144, 168, 0.1)'};
  color: ${({ $state }) =>
    $state === 'ascenso' ? '#4ade80' : $state === 'descenso' ? '#f59e0b' : 'var(--text-secondary)'};
  border: 1px solid
    ${({ $state }) =>
      $state === 'ascenso'
        ? 'rgba(34, 197, 94, 0.25)'
        : $state === 'descenso'
        ? 'rgba(245, 158, 11, 0.25)'
        : 'var(--border)'};
`;

export const FormaAvg = styled.div`
  font-size: 0.8rem;
  color: var(--text-muted);

  strong {
    color: var(--text-primary);
    font-weight: 600;
  }
`;

export const StatsRow = styled.div`
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
`;

export const StatPill = styled.div``;

export const PillValue = styled.div<{ $positive?: boolean; $negative?: boolean }>`
  font-size: 0.95rem;
  font-weight: 700;
  color: ${({ $positive, $negative }) =>
    $positive ? '#4ade80' : $negative ? '#f59e0b' : 'var(--text-secondary)'};
`;

export const PillLabel = styled.div`
  font-size: 0.65rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

export const ChartLabel = styled.div`
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--text-muted);
`;

export const ChartWrap = styled.div`
  height: 110px;
`;

export const SharpIncreaseNote = styled.div`
  font-size: 0.72rem;
  color: var(--warning);
  padding: 0.375rem 0.75rem;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: var(--radius-sm);
`;

/* ── EstadoActual inline ─────────────────────────────────────── */

export const ObsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const ObsItem = styled.div`
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.5;
  padding-left: 1rem;
  position: relative;

  &::before {
    content: '·';
    position: absolute;
    left: 0;
    color: var(--accent);
    font-weight: 700;
  }
`;
