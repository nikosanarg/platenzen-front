import styled from 'styled-components';

export const Card = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;

  @media (max-width: 600px) {
    padding: 1.75rem 1.25rem;
    gap: 1.5rem;
  }
`;

/* ── Level / identity header ─────────────────────────────────── */

export const LevelSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const RoleHeading = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.625rem;
  flex-wrap: wrap;
`;

export const RoleNamePrimary = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.03em;
  line-height: 1.1;

  @media (max-width: 600px) {
    font-size: 1.5rem;
  }
`;

export const LevelBadge = styled.span`
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.03em;
`;

export const XpRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.25rem;
`;

export const XpTrack = styled.div`
  flex: 1;
  height: 6px;
  background: var(--border);
  border-radius: 999px;
  overflow: hidden;
`;

export const XpFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => ($pct * 100).toFixed(1)}%;
  background: var(--accent);
  border-radius: 999px;
  transition: width 0.8s ease;
`;

export const XpLabel = styled.div`
  font-size: 0.72rem;
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
`;

export const XpSummary = styled.div`
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.5;
  padding-top: 0.25rem;

  strong {
    color: var(--text-primary);
    font-weight: 600;
  }
`;

/* ── Roles section ───────────────────────────────────────────── */

export const RolesSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border);
`;

export const RolesSectionTitle = styled.div`
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--text-muted);
`;

/* ── Primary role card (gold) ────────────────────────────────── */

export const PrimaryRoleCard = styled.div`
  background: rgba(184, 134, 11, 0.06);
  border: 1px solid rgba(184, 134, 11, 0.35);
  border-radius: var(--radius-sm);
  padding: 0.875rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const PrimaryMedalLabel = styled.div`
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #c9a42a;
`;

export const PrimaryRoleName = styled.div`
  font-size: 1.05rem;
  font-weight: 700;
  color: #f5c518;
`;

export const PrimaryRoleBranch = styled.div`
  font-size: 0.72rem;
  color: var(--text-muted);
`;

export const PrimaryAfinidadRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-top: 0.375rem;
`;

export const PrimaryAfinidadTrack = styled.div`
  flex: 1;
  height: 3px;
  background: rgba(184, 134, 11, 0.2);
  border-radius: 999px;
  overflow: hidden;
`;

export const PrimaryAfinidadFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  background: #f5c518;
  border-radius: 999px;
  transition: width 0.6s ease;
`;

export const PrimaryAfinidadPct = styled.div`
  font-size: 0.7rem;
  color: #c9a42a;
  white-space: nowrap;
`;

/* ── Secondary roles list ────────────────────────────────────── */

export const SecondaryRolesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

export const SecondaryRoleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border);

  &:last-child {
    border-bottom: none;
  }
`;

export const SecondaryMedalDot = styled.div<{ $rank: 'silver' | 'bronze' | 'none' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ $rank }) =>
    $rank === 'silver' ? '#a8b8c8' : $rank === 'bronze' ? '#cd853f' : 'var(--border-light)'};
`;

export const SecondaryRoleInfo = styled.div`
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 0.375rem;
  flex-wrap: wrap;
`;

export const SecondaryRoleName = styled.span`
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-secondary);
`;

export const SecondaryRoleBranch = styled.span`
  font-size: 0.72rem;
  color: var(--text-muted);
`;

export const SecondaryAfinidad = styled.div`
  font-size: 0.7rem;
  color: var(--text-muted);
  white-space: nowrap;
`;

/* ── Objective selector ──────────────────────────────────────── */

export const ObjectiveSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border);
`;

export const ObjectiveSectionTitle = styled.div`
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--text-muted);
`;

export const ObjectiveBtns = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

export const ObjectiveBtn = styled.button<{ $active: boolean }>`
  background: ${({ $active }) => ($active ? 'var(--accent)' : 'var(--bg-primary)')};
  border: 1px solid ${({ $active }) => ($active ? 'var(--accent)' : 'var(--border)')};
  border-radius: var(--radius-sm);
  padding: 0.4rem 1rem;
  font-size: 0.78rem;
  font-weight: ${({ $active }) => ($active ? '700' : '400')};
  color: ${({ $active }) => ($active ? '#fff' : 'var(--text-secondary)')};
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: var(--accent);
    color: ${({ $active }) => ($active ? '#fff' : 'var(--accent)')};
  }
`;

export const ObjectiveProgress = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.875rem 1rem;
`;

export const ObjectiveAfinidadRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const ObjectiveAfinidadLabel = styled.div`
  font-size: 0.78rem;
  color: var(--text-secondary);
  white-space: nowrap;
`;

export const ObjectiveAfinidadTrack = styled.div`
  flex: 1;
  height: 5px;
  background: var(--border);
  border-radius: 999px;
  overflow: hidden;
`;

export const ObjectiveAfinidadFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  background: var(--accent);
  border-radius: 999px;
  transition: width 0.6s ease;
`;

export const ObjectiveAfinidadPct = styled.div`
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--accent);
  white-space: nowrap;
  flex-shrink: 0;
`;

export const ObjectiveHowTo = styled.div`
  font-size: 0.8rem;
  color: var(--text-muted);
  line-height: 1.55;
`;

/* ── Objective checklist ─────────────────────────────────────── */

export const ChecklistRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem 0.5rem;
  align-items: center;
`;

export const ChecklistChip = styled.span<{ $passed: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.55rem;
  border-radius: 4px;
  font-size: 0.72rem;
  font-weight: ${({ $passed }) => ($passed ? '400' : '600')};
  border: 1px solid ${({ $passed }) => ($passed ? 'var(--border)' : 'rgba(245, 197, 24, 0.5)')};
  background: ${({ $passed }) => ($passed ? 'transparent' : 'rgba(245, 197, 24, 0.08)')};
  color: ${({ $passed }) => ($passed ? 'var(--text-muted)' : '#f5c518')};
  white-space: nowrap;
`;

export const AfinidadPill = styled.span`
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--accent);
  padding-left: 0.25rem;
`;
