'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import type { StravaActivity } from '@/types/strava';
import type { ProcessedStats } from '@/types/stats';
import type { BranchResult } from '@/lib/roles';
import {
  DISTANCE_THRESHOLDS,
  SPEED_THRESHOLDS,
  EXPLORATION_THRESHOLDS,
  ACHIEVEMENT_THRESHOLDS,
  MILESTONE_KM,
} from '@/lib/roleThresholds';
import { HALF_MARATHON_KM } from '@/lib/distances';

// ── Types ──────────────────────────────────────────────────────────────────

type NodeStatus = 'achieved' | 'current' | 'disabled';
type Branch = 'distance' | 'speed' | 'exploration' | 'achievement';

interface ChecklistItem { label: string; passed: boolean; }

// ── Checklist builders ─────────────────────────────────────────────────────

function countMilestones(activities: StravaActivity[]): number {
  const RUNNING = new Set(['Run', 'TrailRun', 'VirtualRun']);
  const runs = activities.filter(a => RUNNING.has(a.sport_type || a.type));
  const reached = new Set<number>();
  for (const a of runs) {
    const km = a.distance / 1000;
    for (const m of MILESTONE_KM) if (km >= m) reached.add(m);
  }
  return reached.size;
}

function calcTrailRatio(activities: StravaActivity[]): number {
  const RUNNING = new Set(['Run', 'TrailRun', 'VirtualRun']);
  const runs = activities.filter(a => RUNNING.has(a.sport_type || a.type));
  if (!runs.length) return 0;
  return runs.filter(a => (a.sport_type || a.type) === 'TrailRun').length / runs.length;
}

function buildChecklist(
  branch: Branch, level: number,
  activities: StravaActivity[], stats: ProcessedStats
): ChecklistItem[] {
  const avgW = stats.weeklyAvgDistance;
  const maxKm = stats.longestActivity;
  const bp = stats.bestPace;
  const totalKm = stats.totalDistance;
  const totalActs = stats.totalActivities;
  const trail = calcTrailRatio(activities);
  const msCount = countMilestones(activities);
  const hasHalf = msCount >= MILESTONE_KM.indexOf(HALF_MARATHON_KM) + 1;
  const fmtP = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}/km`;

  if (branch === 'distance') {
    if (level === 1) return [
      { label: `${DISTANCE_THRESHOLDS.fondista_weekly_km} km/sem`, passed: avgW >= DISTANCE_THRESHOLDS.fondista_weekly_km },
      { label: `Salida ${DISTANCE_THRESHOLDS.fondista_longest_km} km`, passed: maxKm >= DISTANCE_THRESHOLDS.fondista_longest_km },
    ];
    if (level === 2) return [
      { label: `${DISTANCE_THRESHOLDS.ultrafondista_weekly_km} km/sem`, passed: avgW >= DISTANCE_THRESHOLDS.ultrafondista_weekly_km },
      { label: `Salida ${DISTANCE_THRESHOLDS.ultrafondista_longest_km} km`, passed: maxKm >= DISTANCE_THRESHOLDS.ultrafondista_longest_km },
    ];
    if (level === 3) return [
      { label: `Maratón ${DISTANCE_THRESHOLDS.maratonista_longest_km} km`, passed: maxKm >= DISTANCE_THRESHOLDS.maratonista_longest_km },
    ];
  }
  if (branch === 'speed') {
    if (level === 1) return [{ label: `< ${fmtP(SPEED_THRESHOLDS.pasadista_pace_sec)}`, passed: bp > 0 && bp < SPEED_THRESHOLDS.pasadista_pace_sec }];
    if (level === 2) return [{ label: `< ${fmtP(SPEED_THRESHOLDS.velocista_pace_sec)}`, passed: bp > 0 && bp < SPEED_THRESHOLDS.velocista_pace_sec }];
  }
  if (branch === 'exploration') {
    if (level === 1) return [
      { label: `${EXPLORATION_THRESHOLDS.trotamundos_total_km} km acum.`, passed: totalKm >= EXPLORATION_THRESHOLDS.trotamundos_total_km },
      { label: `${Math.round(EXPLORATION_THRESHOLDS.trotamundos_trail_ratio * 100)}% trail`, passed: trail >= EXPLORATION_THRESHOLDS.trotamundos_trail_ratio },
    ];
    if (level === 2) return [
      { label: `${EXPLORATION_THRESHOLDS.conquistador_total_km} km acum.`, passed: totalKm >= EXPLORATION_THRESHOLDS.conquistador_total_km },
      { label: `${Math.round(EXPLORATION_THRESHOLDS.conquistador_trail_ratio * 100)}% trail`, passed: trail >= EXPLORATION_THRESHOLDS.conquistador_trail_ratio },
    ];
  }
  if (branch === 'achievement') {
    if (level === 0) return [{ label: `${ACHIEVEMENT_THRESHOLDS.competidor_min_activities} actividades`, passed: totalActs >= ACHIEVEMENT_THRESHOLDS.competidor_min_activities }];
    if (level === 1) return [
      { label: `${ACHIEVEMENT_THRESHOLDS.coleccionador_min_activities} actividades`, passed: totalActs >= ACHIEVEMENT_THRESHOLDS.coleccionador_min_activities },
      { label: `${ACHIEVEMENT_THRESHOLDS.coleccionador_min_milestones} hitos`, passed: msCount >= ACHIEVEMENT_THRESHOLDS.coleccionador_min_milestones },
      { label: `${ACHIEVEMENT_THRESHOLDS.coleccionador_min_total_km} km`, passed: totalKm >= ACHIEVEMENT_THRESHOLDS.coleccionador_min_total_km },
    ];
    if (level === 2) return [
      { label: `${ACHIEVEMENT_THRESHOLDS.medallista_min_activities} actividades`, passed: totalActs >= ACHIEVEMENT_THRESHOLDS.medallista_min_activities },
      { label: `${ACHIEVEMENT_THRESHOLDS.medallista_min_milestones} hitos`, passed: msCount >= ACHIEVEMENT_THRESHOLDS.medallista_min_milestones },
      { label: 'Media maratón', passed: hasHalf },
      { label: `${ACHIEVEMENT_THRESHOLDS.medallista_min_total_km} km`, passed: totalKm >= ACHIEVEMENT_THRESHOLDS.medallista_min_total_km },
    ];
  }
  return [];
}

function getNodeStatus(currentLevel: number, roleLevel: number, isMax: boolean): NodeStatus {
  if (currentLevel > roleLevel) return 'achieved';
  if (currentLevel === roleLevel) return isMax ? 'achieved' : 'current';
  return 'disabled';
}

function edgeColor(s: NodeStatus) {
  return s === 'achieved' ? '#22c55e' : s === 'current' ? '#f5c518' : '#2a2a35';
}

// ── Branch definitions ─────────────────────────────────────────────────────

interface BranchDef {
  id: Branch; col: number;
  roles: { id: string; name: string; level: number }[];
}

const BRANCHES: BranchDef[] = [
  { id: 'distance', col: 0, roles: [
    { id: 'fondista', name: 'Fondista', level: 1 },
    { id: 'ultrafondista', name: 'Ultrafondista', level: 2 },
    { id: 'maratonista', name: 'Maratonista', level: 3 },
  ]},
  { id: 'speed', col: 1, roles: [
    { id: 'corredor', name: 'Corredor', level: 0 },
    { id: 'pasadista', name: 'Pasadista', level: 1 },
    { id: 'velocista', name: 'Velocista', level: 2 },
  ]},
  { id: 'exploration', col: 2, roles: [
    { id: 'explorador', name: 'Explorador', level: 0 },
    { id: 'trotamundos', name: 'Trotamundos', level: 1 },
    { id: 'conquistador', name: 'Conquistador', level: 2 },
  ]},
  { id: 'achievement', col: 3, roles: [
    { id: 'competidor', name: 'Competidor', level: 0 },
    { id: 'coleccionador', name: 'Coleccionador', level: 1 },
    { id: 'medallista', name: 'Medallista', level: 2 },
  ]},
];

// ── Card with shared open-state ────────────────────────────────────────────

interface RoleCardProps {
  cardId: string;
  label: string;
  status: NodeStatus;
  afinidad?: number;
  checklist: ChecklistItem[];
  openId: string | null;
  onToggle: (id: string) => void;
  isAmateur?: boolean;
}

function RoleCard({ cardId, label, status, afinidad, checklist, openId, onToggle, isAmateur }: RoleCardProps) {
  const isOpen = openId === cardId;
  const border = edgeColor(status);
  const text = status === 'achieved' ? '#22c55e' : status === 'current' ? '#f5c518' : '#606078';
  const bg = status === 'achieved' ? 'rgba(34,197,94,0.07)' : status === 'current' ? 'rgba(245,197,24,0.07)' : '#141417';
  const hasTooltip = isAmateur || checklist.length > 0 || status === 'achieved';

  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 0, maxWidth: '8rem' }}>
      <div
        onClick={(e) => { e.stopPropagation(); if (hasTooltip) onToggle(cardId); }}
        style={{
          minHeight: '3rem',
          maxHeight: '3rem',
          padding: '5px 4px',
          background: bg,
          border: `1.5px solid ${border}`,
          borderRadius: 6,
          cursor: hasTooltip ? 'pointer' : 'default',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          userSelect: 'none',
          overflow: 'hidden',
        }}
      >
        <div style={{ fontSize: 10, fontWeight: 600, color: text, lineHeight: 1.2 }}>
          {label}
        </div>
        {status === 'current' && afinidad !== undefined && (
          <div style={{ fontSize: 8, color: '#c9a42a', marginTop: 2 }}>({afinidad}%)</div>
        )}
      </div>

      {isOpen && hasTooltip && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: 0,
            background: '#1a1a1f',
            border: '1px solid #2a2a35',
            borderRadius: 8,
            padding: '7px 9px',
            minWidth: 160,
            zIndex: 9999,
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, color: '#f0f0f5', marginBottom: 3 }}>{label}</div>
          {isAmateur
            ? <div style={{ fontSize: 10, color: '#9090a8' }}>Estado inicial</div>
            : status === 'achieved'
              ? <div style={{ fontSize: 10, color: '#22c55e' }}>✓ Desbloqueado</div>
              : checklist.map((it, i) => (
                <div key={i} style={{ fontSize: 10, color: it.passed ? '#22c55e' : '#9090a8', marginTop: 2 }}>
                  {it.passed ? '✓' : '·'} {it.label}
                </div>
              ))
          }
        </div>
      )}
    </div>
  );
}

// ── Arrow between roles ────────────────────────────────────────────────────

function Arrow({ status }: { status: NodeStatus }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '0 2px',
      color: edgeColor(status), fontSize: 13, flexShrink: 0,
    }}>
      ›
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

interface RoleTreeProps {
  branches: BranchResult[];
  activities: StravaActivity[];
  stats: ProcessedStats;
}

export default function RoleTree({ branches, activities, stats }: RoleTreeProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const treeRef = useRef<HTMLDivElement>(null);

  const toggleCard = (id: string) => setOpenId(prev => prev === id ? null : id);

  // Close tooltip when clicking outside the tree container
  useEffect(() => {
    if (!openId) return;
    const handleOutside = (e: MouseEvent) => {
      if (treeRef.current && !treeRef.current.contains(e.target as Node)) {
        setOpenId(null);
      }
    };
    document.addEventListener('click', handleOutside, true);
    return () => document.removeEventListener('click', handleOutside, true);
  }, [openId]);

  const branchMap = useMemo(
    () => Object.fromEntries(branches.map(b => [b.branch, b])) as Record<Branch, BranchResult>,
    [branches]
  );

  const distCurrentLevel = branchMap.distance?.currentRole.level ?? 0;
  const amateurStatus: NodeStatus = distCurrentLevel > 0 ? 'achieved' : 'current';

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
    <div ref={treeRef} onClick={() => setOpenId(null)} style={{ display: 'flex', flexDirection: 'column', gap: 0, width: '100%', maxWidth: 480 }}>
      {/* Amateur — own row, same structure as branch rows but single cell */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
        <RoleCard
          cardId="amateur"
          label="Amateur"
          status={amateurStatus}
          afinidad={amateurStatus === 'current' ? branchMap.distance?.afinidad : undefined}
          checklist={[]}
          isAmateur
          openId={openId}
          onToggle={toggleCard}
        />
      </div>
      <div style={{ height: 8 }} />

      {/* Branch rows */}
      {BRANCHES.map((branch, bi) => {
        const br = branchMap[branch.id];
        const currentLevel = br?.currentRole.level ?? 0;
        const maxLevel = branch.roles[branch.roles.length - 1].level;

        return (
          <React.Fragment key={branch.id}>
            {bi > 0 && <div style={{ height: 8 }} />}
            <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
              {branch.roles.map((role, ri) => {
                const isMax = role.level === maxLevel;
                const status = getNodeStatus(currentLevel, role.level, isMax);
                const prevStatus = ri === 0
                  ? amateurStatus
                  : getNodeStatus(currentLevel, branch.roles[ri - 1].level, false);
                return (
                  <React.Fragment key={role.id}>
                    {ri > 0 && <Arrow status={prevStatus} />}
                    <RoleCard
                      cardId={role.id}
                      label={role.name}
                      status={status}
                      afinidad={status === 'current' ? br?.afinidad : undefined}
                      checklist={status !== 'achieved' ? buildChecklist(branch.id, role.level, activities, stats) : []}
                      openId={openId}
                      onToggle={toggleCard}
                    />
                  </React.Fragment>
                );
              })}
            </div>
          </React.Fragment>
        );
      })}
    </div>
    </div>
  );
}
