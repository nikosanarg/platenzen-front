'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';
import { BranchResult, RoleBranchId } from '@/lib/roles';
import { computeNodeChecklist, RoleNodeId } from '@/lib/roleChecklist';

// ── Styled components ──────────────────────────────────────────────────────

const TreeSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border);
`;

const TreeSectionTitle = styled.div`
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--text-muted);
`;

const TreeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.375rem;
  }
`;

const BranchColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
`;

const BranchLabel = styled.div`
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
`;

const Connector = styled.div`
  width: 2px;
  height: 16px;
  background: var(--border);
  flex-shrink: 0;
`;

const RoleNode = styled.button<{
  $state: 'current' | 'reached' | 'locked';
}>`
  width: 100%;
  padding: 0.45rem 0.375rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: ${({ $state }) => $state === 'current' ? '700' : '500'};
  cursor: pointer;
  text-align: center;
  transition: all 0.15s;
  border: 1px solid ${({ $state }) =>
    $state === 'current' ? '#f5c518' :
    $state === 'reached' ? 'rgba(74, 222, 128, 0.4)' :
    'var(--border)'};
  background: ${({ $state }) =>
    $state === 'current' ? 'rgba(245, 197, 24, 0.12)' :
    $state === 'reached' ? 'rgba(74, 222, 128, 0.06)' :
    'transparent'};
  color: ${({ $state }) =>
    $state === 'current' ? '#f5c518' :
    $state === 'reached' ? '#4ade80' :
    'var(--text-muted)'};
  opacity: ${({ $state }) => $state === 'locked' ? 0.5 : 1};
  box-shadow: ${({ $state }) =>
    $state === 'current' ? '0 0 8px rgba(245, 197, 24, 0.3)' : 'none'};

  &:hover {
    opacity: 1;
    border-color: ${({ $state }) =>
      $state === 'current' ? '#f5c518' :
      $state === 'reached' ? '#4ade80' :
      'var(--text-muted)'};
  }
`;

const RootNodeRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
`;

const RootNode = styled.div<{ $reached: boolean }>`
  padding: 0.4rem 1.25rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  text-align: center;
  border: 1px solid ${({ $reached }) => $reached ? 'rgba(74, 222, 128, 0.5)' : 'var(--border)'};
  background: ${({ $reached }) => $reached ? 'rgba(74, 222, 128, 0.08)' : 'transparent'};
  color: ${({ $reached }) => $reached ? '#4ade80' : 'var(--text-muted)'};
`;

const ChecklistPanel = styled.div`
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.75rem 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ChecklistPanelTitle = styled.div`
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-secondary);
  margin-bottom: 0.125rem;
`;

const ChecklistItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const CheckItem = styled.div<{ $passed: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: ${({ $passed }) => $passed ? 'var(--text-muted)' : 'var(--text-secondary)'};
  text-decoration: ${({ $passed }) => $passed ? 'line-through' : 'none'};
  opacity: ${({ $passed }) => $passed ? 0.7 : 1};
`;

const CheckIcon = styled.span<{ $passed: boolean }>`
  color: ${({ $passed }) => $passed ? '#4ade80' : '#f5c518'};
  flex-shrink: 0;
  font-size: 0.75rem;
`;

// ── Branch config ──────────────────────────────────────────────────────────

interface BranchConfig {
  id: RoleBranchId;
  label: string;
  nodes: Array<{ id: RoleNodeId; name: string; level: number }>;
}

const BRANCHES: BranchConfig[] = [
  {
    id: 'distance',
    label: 'Distancia',
    nodes: [
      { id: 'fondista', name: 'Fondista', level: 1 },
      { id: 'ultrafondista', name: 'Ultrafondista', level: 2 },
      { id: 'maratonista', name: 'Maratonista', level: 3 },
    ],
  },
  {
    id: 'speed',
    label: 'Velocidad',
    nodes: [
      { id: 'corredor', name: 'Corredor', level: 0 },
      { id: 'pasadista', name: 'Pasadista', level: 1 },
      { id: 'velocista', name: 'Velocista', level: 2 },
    ],
  },
  {
    id: 'exploration',
    label: 'Exploración',
    nodes: [
      { id: 'explorador', name: 'Explorador', level: 0 },
      { id: 'trotamundos', name: 'Trotamundos', level: 1 },
      { id: 'conquistador', name: 'Conquistador', level: 2 },
    ],
  },
  {
    id: 'achievement',
    label: 'Logros',
    nodes: [
      { id: 'competidor', name: 'Competidor', level: 0 },
      { id: 'coleccionador', name: 'Coleccionador', level: 1 },
      { id: 'medallista', name: 'Medallista', level: 2 },
    ],
  },
];

// ── Main component ─────────────────────────────────────────────────────────

interface GuildTreeProps {
  branches: BranchResult[];
  activities: StravaActivity[];
  stats: ProcessedStats;
}

const GuildTree: React.FC<GuildTreeProps> = ({ branches, activities, stats }) => {
  const [selectedNode, setSelectedNode] = useState<{ id: RoleNodeId; name: string } | null>(null);

  const branchMap = new Map(branches.map(b => [b.branch, b]));

  const isRunnerActive = branches.some(b => b.currentRole.level >= 0);

  const handleNodeClick = (nodeId: RoleNodeId, name: string) => {
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    } else {
      setSelectedNode({ id: nodeId, name });
    }
  };

  const checklist = selectedNode
    ? computeNodeChecklist(selectedNode.id, activities, stats)
    : null;

  return (
    <TreeSection>
      <TreeSectionTitle>Árbol de roles</TreeSectionTitle>

      <RootNodeRow>
        <RootNode $reached={isRunnerActive}>Amateur</RootNode>
      </RootNodeRow>

      <TreeGrid>
        {BRANCHES.map(branch => {
          const branchResult = branchMap.get(branch.id);
          const currentLevel = branchResult?.currentRole.level ?? -1;

          return (
            <BranchColumn key={branch.id}>
              <BranchLabel>{branch.label}</BranchLabel>
              {branch.nodes.map((node, idx) => {
                const isReached = node.level <= currentLevel;
                const isCurrent = node.level === currentLevel;
                const state: 'current' | 'reached' | 'locked' = isCurrent
                  ? 'current'
                  : isReached
                  ? 'reached'
                  : 'locked';

                return (
                  <React.Fragment key={node.id}>
                    {idx > 0 && <Connector />}
                    <RoleNode
                      $state={state}
                      onClick={() => handleNodeClick(node.id, node.name)}
                      title={`Ver requisitos de ${node.name}`}
                    >
                      {node.name}
                    </RoleNode>
                  </React.Fragment>
                );
              })}
            </BranchColumn>
          );
        })}
      </TreeGrid>

      {selectedNode && checklist && (
        <ChecklistPanel>
          <ChecklistPanelTitle>
            {selectedNode.name} — requisitos
          </ChecklistPanelTitle>
          <ChecklistItems>
            {checklist.items.map((item, i) => (
              <CheckItem key={i} $passed={item.passed}>
                <CheckIcon $passed={item.passed}>
                  {item.passed ? '✓' : '□'}
                </CheckIcon>
                {item.label}
              </CheckItem>
            ))}
          </ChecklistItems>
        </ChecklistPanel>
      )}
    </TreeSection>
  );
};

export default GuildTree;
