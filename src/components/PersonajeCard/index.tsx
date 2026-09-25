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
import RoleSwitcher from './RoleSwitcher';
import {
  Card,
  TopRow,
  IdentityMain,
  VisualCol,
  AdnChartWrapper,
  RoleHeading,
  LevelBadge,
  CoreRecord,
  CoreRecordValue,
  CoreRecordJoin,
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
} from './styled';

interface PersonajeCardProps {
  activities: Activity[];
  stats: ProcessedStats;
}

/** Por debajo de este ancho, "actividades registradas" (la etiqueta más larga) ya no entra en una línea. */
const COMPACT_STATS_WIDTH = 340;

/**
 * Mide `StatsGrid` a mano en vez de un `@container` o un `ResizeObserver`:
 * en esta grilla en particular —adentro de un `grid-area` cuyo ancho lo da
 * un `fr` de un grid ancestro, no un ancho propio— las dos APIs reportaban
 * un ancho más grande que el real (`ResizeObserver` devolvía el ancho
 * previo a que `auto-fit` resolviera las columnas, no el final). El resize
 * de ventana con `getBoundingClientRect`, que sí da el ancho pintado, no
 * tiene ese problema.
 */
function useCompactStats<T extends HTMLElement>() {
  const ref = React.useRef<T>(null);
  const [compact, setCompact] = useState(false);

  React.useEffect(() => {
    const medir = () => {
      const el = ref.current;
      if (!el) return;
      setCompact(el.getBoundingClientRect().width < COMPACT_STATS_WIDTH);
    };

    medir();
    // Un segundo pase tras el primer paint: la tipografía web puede llegar
    // después del layout inicial y correr el ancho un poco.
    const raf = requestAnimationFrame(medir);
    window.addEventListener('resize', medir);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', medir);
    };
  }, []);

  return { ref, compact };
}

const PersonajeCard: React.FC<PersonajeCardProps> = ({ activities, stats }) => {
  const { ref: statsRef, compact: compactStats } = useCompactStats<HTMLDivElement>();
  const tree = useMemo(() => computeBranchTree(activities), [activities]);
  const decay = useMemo(() => computeBranchDecay(activities), [activities]);

  const roles = computeRoles(activities, stats);
  const longestStreak = computeLongestWeeklyStreak(stats.daily);
  const coreRecord = useMemo(() => computeCoreRecord(activities), [activities]);

  /**
   * La rama dominante da el título: la más avanzada, y a igual nivel la más
   * completa. Pero el empate que habilita el cambio es por NIVEL solo: dos
   * ramas en el mismo nivel siguen siendo la misma "distancia" del próximo
   * nivel (ninguna llegó al 100%), aunque una vaya con 75% y la otra con
   * 50% dentro de ese tramo — el porcentaje sólo desempata cuál se muestra
   * primero, no cuáles se pueden elegir.
   */
  const dominanteAuto = useMemo(
    () =>
      [...tree.branches].sort((a, b) => (b.level - a.level) || (b.pct - a.pct))[0],
    [tree],
  );
  const empatados = useMemo(() => {
    if (dominanteAuto.level === 0) return [dominanteAuto];
    const candidatos = tree.branches.filter(b => b.level === dominanteAuto.level);
    return candidatos.length > 0 ? candidatos : [dominanteAuto];
  }, [tree, dominanteAuto]);

  const [elegidoId, setElegidoId] = useState<BranchId | null>(null);
  const dominante = empatados.find(b => b.id === elegidoId) ?? empatados[0];

  const titulo = dominante.level > 0 ? dominante.tiers[dominante.level - 1].name : 'Corredor';
  const opcionesRama = empatados.map(b => ({
    id: b.id,
    label: b.level > 0 ? b.tiers[b.level - 1].name : 'Corredor',
    pct: b.pct,
  }));

  const consistencia = tree.branches.find(b => b.id === 'consistencia')?.pct ?? 0;
  const persona = buildPersonaDescription(roles.primary, stats, Math.round(consistencia));

  const decayPcts = decay.branches.map(b => b.pct);

  return (
    <Card>
      <TopRow>
        {/* ── Resumen: quién sos y los números gruesos ── */}
        <IdentityMain>
          <RoleHeading>
            <RoleSwitcher
              selectedId={dominante.id}
              selectedLabel={titulo}
              options={opcionesRama}
              onSelect={(id) => setElegidoId(id as BranchId)}
            />
            <LevelBadge>{dominante.name}</LevelBadge>
          </RoleHeading>

          {coreRecord && (
            <CoreRecord>
              <CoreRecordValue>
                {coreRecord.label} <CoreRecordJoin>en</CoreRecordJoin> {formatRecordTime(coreRecord.timeSeconds)}
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
        <StatsGrid ref={statsRef}>
          <StatCard>
            <StatIcon><IconRoute size={18} color="currentColor" /></StatIcon>
            <StatBody>
              <StatValue>{Math.round(stats.totalDistance).toLocaleString('es-AR')}</StatValue>
              <StatLabel $compact={compactStats}>kilómetros recorridos</StatLabel>
            </StatBody>
          </StatCard>

          <StatCard>
            <StatIcon><IconCalendar size={18} color="currentColor" /></StatIcon>
            <StatBody>
              <StatValue>{stats.totalActivities.toLocaleString('es-AR')}</StatValue>
              <StatLabel $compact={compactStats}>actividades registradas</StatLabel>
            </StatBody>
          </StatCard>

          <StatCard>
            <StatIcon><IconFlame size={18} color="currentColor" /></StatIcon>
            <StatBody>
              <StatValue>{longestStreak}</StatValue>
              <StatLabel $compact={compactStats}>semanas seguidas</StatLabel>
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
