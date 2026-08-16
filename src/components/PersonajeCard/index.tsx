'use client';

import React, { useMemo } from 'react';
import { Activity } from '@/types/activity';
import { ProcessedStats } from '@/types/stats';
import { computeRoles } from '@/lib/roles';
import { computeBranchTree, computeBranchDecay, DIAS_DECAIMIENTO } from '@/lib/branchTree';
import { computeLongestWeeklyStreak } from '@/utils/streaks';
import { computeCoreRecord } from '@/lib/coreRecord';
import { formatRecordTime } from '@/lib/recordHistory';
import { buildPersonaDescription } from '@/lib/runnerPersona';
import { IconRoute, IconCalendar, IconFlame, IconHourglass } from '@/components/Icon';
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
  VisualColTitle,
  RadarNote,
  RadarNoteDot,
  ActivitySection,
  ActivityTitle,
  ActivitySubtitle,
} from './styled';

interface PersonajeCardProps {
  activities: Activity[];
  stats: ProcessedStats;
}

const PersonajeCard: React.FC<PersonajeCardProps> = ({ activities, stats }) => {
  const tree = useMemo(() => computeBranchTree(activities), [activities]);
  const decay = useMemo(() => computeBranchDecay(activities), [activities]);

  const roles = computeRoles(activities, stats);
  const longestStreak = computeLongestWeeklyStreak(stats.daily);
  const coreRecord = computeCoreRecord(activities);

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
                <StatValue $emphasis>{longestStreak} {longestStreak === 1 ? 'semana' : 'semanas'}</StatValue>
                <StatLabel>Mejor racha</StatLabel>
              </StatBody>
            </StatCard>

            <StatCard>
              <StatIcon $emphasis><IconHourglass size={18} color="currentColor" /></StatIcon>
              <StatBody>
                <StatValue $emphasis>{coreRecord ? formatRecordTime(coreRecord.timeSeconds) : '—'}</StatValue>
                <StatLabel>{coreRecord ? `Récord ${coreRecord.label}` : 'Récord'}</StatLabel>
              </StatBody>
            </StatCard>
          </StatsGrid>
        </IdentityCol>

        {/* ── Radar: el mismo cálculo del árbol, visto de una ── */}
        <VisualCol>
          <VisualColTitle>Perfil de corredor</VisualColTitle>
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
        </VisualCol>

        {/* ── Árbol de habilidades ── */}
        <VisualCol>
          <VisualColTitle>Árbol de habilidades</VisualColTitle>
          <SkillTree tree={tree} />
        </VisualCol>
      </TopRow>

      {/* ── Consistencia anual: el heatmap como evidencia, no decoración ── */}
      <ActivitySection>
        <ActivityTitle>Tu año en actividad</ActivityTitle>
        <ActivitySubtitle>
          {longestStreak} {longestStreak === 1 ? 'semana activa' : 'semanas activas'} · {stats.totalActivities.toLocaleString('es-AR')} actividades · {Math.round(stats.totalDistance).toLocaleString('es-AR')} km
        </ActivitySubtitle>
        <ActivityHeatmap data={stats.daily} />
      </ActivitySection>
    </Card>
  );
};

export default PersonajeCard;
