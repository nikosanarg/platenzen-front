'use client';

import React, { useMemo, useState } from 'react';
import { Activity } from '@/types/activity';
import { ProcessedStats } from '@/types/stats';
import { computeRoles } from '@/lib/roles';
import { BranchId, computeBranchTree, computeBranchDecay } from '@/lib/branchTree';
import { computeCoreRecord } from '@/lib/coreRecord';
import { formatRecordTime } from '@/lib/recordHistory';
import { computeLongestWeeklyStreak } from '@/utils/streaks';
import { buildPersonaDescription } from '@/lib/runnerPersona';
import { IconRoute, IconCalendar, IconFlame } from '@/components/Icon';
import ActivityHeatmap from '@/components/charts/ActivityHeatmap';
import BranchProfile from './BranchProfile';
import {
  Card,
  TopRow,
  IdentityMain,
  VisualCol,
  AdnChartWrapper,
  RoleHeading,
  RoleNamePrimary,
  LevelBadge,
  CoreRecord,
  CoreRecordValue,
  CoreRecordLabel,
  PersonaText,
  StatsGrid,
  StatCard,
  StatIcon,
  StatBody,
  StatValue,
  StatLabel,
  VisualPanel,
  ActivitySection,
  SwitchChip,
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
  const coreRecord = useMemo(() => computeCoreRecord(activities), [activities]);

  /**
   * La rama dominante da el título: la más avanzada, y a igual nivel la más
   * completa. Cuando dos o más empatan en nivel Y porcentaje —no hay una
   * lectura más completa que la otra— se ofrece el cambio en vez de elegir en
   * silencio una entre iguales.
   */
  const dominanteAuto = useMemo(
    () =>
      [...tree.branches].sort((a, b) => (b.level - a.level) || (b.pct - a.pct))[0],
    [tree],
  );
  const empatados = useMemo(() => {
    if (dominanteAuto.level === 0) return [dominanteAuto];
    const candidatos = tree.branches.filter(
      b => b.level === dominanteAuto.level && Math.abs(b.pct - dominanteAuto.pct) < 0.001,
    );
    return candidatos.length > 0 ? candidatos : [dominanteAuto];
  }, [tree, dominanteAuto]);

  const [elegidoId, setElegidoId] = useState<BranchId | null>(null);
  const dominante = empatados.find(b => b.id === elegidoId) ?? empatados[0];
  const alternativas = empatados.filter(b => b.id !== dominante.id);

  const titulo = dominante.level > 0 ? dominante.tiers[dominante.level - 1].name : 'Corredor';

  const consistencia = tree.branches.find(b => b.id === 'consistencia')?.pct ?? 0;
  const persona = buildPersonaDescription(roles.primary, stats, Math.round(consistencia));

  const decayPcts = decay.branches.map(b => b.pct);

  return (
    <Card>
      <TopRow>
        {/* ── Resumen: quién sos y los números gruesos ── */}
        <IdentityMain>
          <RoleHeading>
            <RoleNamePrimary>{titulo}</RoleNamePrimary>
            <LevelBadge>{dominante.name}</LevelBadge>
            {alternativas.map(alt => (
              <SwitchChip key={alt.id} type="button" onClick={() => setElegidoId(alt.id)}>
                Cambiar a {alt.tiers[alt.level - 1].name}
              </SwitchChip>
            ))}
          </RoleHeading>

          {coreRecord && (
            <CoreRecord>
              <CoreRecordValue>
                {coreRecord.label} en {formatRecordTime(coreRecord.timeSeconds)}
              </CoreRecordValue>
              <CoreRecordLabel>tu mejor marca</CoreRecordLabel>
            </CoreRecord>
          )}

          <PersonaText>{persona}</PersonaText>
        </IdentityMain>

        {/* ── Perfil de corredor: radar y árbol, un solo dibujo ── */}
        <VisualCol>
          <VisualPanel>
            <AdnChartWrapper>
              <BranchProfile tree={tree} decay={decayPcts} dominantId={dominante.id} />
            </AdnChartWrapper>
          </VisualPanel>
        </VisualCol>

        {/* ── Los tres números gruesos ── */}
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
            <StatIcon><IconFlame size={18} color="currentColor" /></StatIcon>
            <StatBody>
              <StatValue>{longestStreak}</StatValue>
              <StatLabel>Semanas al hilo</StatLabel>
            </StatBody>
          </StatCard>
        </StatsGrid>

        {/* ── Constancia: el heatmap solo, sin título ni leyenda propios ── */}
        <ActivitySection>
          <ActivityHeatmap data={stats.daily} />
        </ActivitySection>
      </TopRow>
    </Card>
  );
};

export default PersonajeCard;
