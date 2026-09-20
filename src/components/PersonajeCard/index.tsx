'use client';

import React, { useMemo, useState } from 'react';
import { Activity } from '@/types/activity';
import { ProcessedStats } from '@/types/stats';
import { computeRoles } from '@/lib/roles';
import { computeBranchTree, computeBranchDecay, DIAS_DECAIMIENTO } from '@/lib/branchTree';
import { computeLongestWeeklyStreak } from '@/utils/streaks';
import { buildPersonaDescription } from '@/lib/runnerPersona';
import { IconRoute, IconCalendar, IconFlame } from '@/components/Icon';
import ActivityHeatmap from '@/components/charts/ActivityHeatmap';
import SpiderChart from './SpiderChart';
import SkillTree from './SkillTree';
import {
  Card,
  TopRow,
  IdentityCol,
  VisualCol,
  AdnChartWrapper,
  RoleHeading,
  RoleNamePrimary,
  LevelBadge,
  PersonaText,
  StatsGrid,
  StatCard,
  StatIcon,
  StatBody,
  StatValue,
  StatLabel,
  VisualSwitch,
  VisualSwitchBtn,
  VisualPanel,
  RadarNote,
  RadarNoteDot,
  ActivitySection,
} from './styled';

/** Las dos lecturas del mismo cálculo de ramas. El radar es la de entrada. */
const VISTAS = [
  { id: 'radar', label: 'Radar' },
  { id: 'arbol', label: 'Árbol' },
] as const;

type Vista = (typeof VISTAS)[number]['id'];

interface PersonajeCardProps {
  activities: Activity[];
  stats: ProcessedStats;
}

const PersonajeCard: React.FC<PersonajeCardProps> = ({ activities, stats }) => {
  const [vista, setVista] = useState<Vista>('radar');
  const tree = useMemo(() => computeBranchTree(activities), [activities]);
  const decay = useMemo(() => computeBranchDecay(activities), [activities]);

  const roles = computeRoles(activities, stats);
  const longestStreak = computeLongestWeeklyStreak(stats.daily);

  /** La rama dominante es la que da el título: la más avanzada, y a igual nivel la más completa. */
  const dominante = useMemo(
    () =>
      [...tree.branches].sort((a, b) => (b.level - a.level) || (b.pct - a.pct))[0],
    [tree],
  );
  const titulo = dominante.level > 0 ? dominante.tiers[dominante.level - 1].name : 'Corredor';

  const consistencia = tree.branches.find(b => b.id === 'consistencia')?.pct ?? 0;
  const persona = buildPersonaDescription(roles.primary, stats, Math.round(consistencia));

  const decayPcts = decay.branches.map(b => b.pct);
  const enRiesgo = tree.branches.filter((b, i) => b.pct - decayPcts[i] > 0.5);

  return (
    <Card>
      <TopRow>
        {/* ── Resumen: quién sos y los números gruesos ── */}
        <IdentityCol>
          <RoleHeading>
            <RoleNamePrimary>{titulo}</RoleNamePrimary>
            <LevelBadge>{dominante.name}</LevelBadge>
          </RoleHeading>

          <PersonaText>{persona}</PersonaText>

          <StatsGrid>
            <StatCard>
              <StatIcon><IconRoute size={18} color="currentColor" /></StatIcon>
              <StatBody>
                <StatValue>{Math.round(stats.totalDistance).toLocaleString('es-AR')} km</StatValue>
                <StatLabel>recorrido</StatLabel>
              </StatBody>
            </StatCard>

            <StatCard>
              <StatIcon><IconCalendar size={18} color="currentColor" /></StatIcon>
              <StatBody>
                <StatValue>{stats.totalActivities.toLocaleString('es-AR')}</StatValue>
                <StatLabel>actividades</StatLabel>
              </StatBody>
            </StatCard>

            <StatCard>
              <StatIcon $emphasis><IconFlame size={18} color="currentColor" /></StatIcon>
              <StatBody>
                <StatValue $emphasis>{longestStreak}</StatValue>
                <StatLabel>Semanas al hilo</StatLabel>
              </StatBody>
            </StatCard>
          </StatsGrid>

          {/* ── Consistencia anual: el heatmap como evidencia, no decoración ── */}
          <ActivitySection>
            <ActivityHeatmap data={stats.daily} />
          </ActivitySection>
        </IdentityCol>

        {/* ── Perfil de corredor: el radar y el árbol son el mismo cálculo ── */}
        <VisualCol>
          <VisualSwitch role="tablist" aria-label="Perfil de corredor">
            {VISTAS.map(v => (
              <VisualSwitchBtn
                key={v.id}
                type="button"
                role="tab"
                id={`perfil-tab-${v.id}`}
                aria-selected={vista === v.id}
                aria-controls="perfil-panel"
                $active={vista === v.id}
                onClick={() => setVista(v.id)}
              >
                {v.label}
              </VisualSwitchBtn>
            ))}
          </VisualSwitch>

          <VisualPanel
            role="tabpanel"
            id="perfil-panel"
            aria-labelledby={`perfil-tab-${vista}`}
          >
            {vista === 'radar' ? (
              <>
                <AdnChartWrapper>
                  <SpiderChart branches={tree.branches} decay={decayPcts} />
                </AdnChartWrapper>
                <RadarNote>
                  {enRiesgo.length > 0 ? (
                    <>
                      <RadarNoteDot />
                      Dónde quedarías si dejaras de correr {DIAS_DECAIMIENTO} días.
                    </>
                  ) : (
                    'Tu progreso no vence en el próximo mes.'
                  )}
                </RadarNote>
              </>
            ) : (
              <SkillTree tree={tree} />
            )}
          </VisualPanel>
        </VisualCol>
      </TopRow>
    </Card>
  );
};

export default PersonajeCard;
