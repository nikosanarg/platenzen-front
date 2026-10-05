'use client';

import React, { useState } from 'react';
import { HeroProfile, DESTACADAS, DestacadaKey, HeroActividad } from '@/lib/heroProfile';
import { VENTANA_DIAS } from '@/lib/ranking';
import { formatRecordTime } from '@/lib/recordHistory';
import { kmToString } from '@/utils/units';
import { secPerKmToString } from '@/utils/pace';
import { parseLocalDate } from '@/utils/localDate';
import { banderaPais, nombrePais } from '@/lib/paises';
import { IconRoute, IconCalendar, IconFlame, IconRun } from '@/components/Icon';
import ActivityHeatmap from '@/components/charts/ActivityHeatmap';
import BranchProfile from '@/components/PersonajeCard/BranchProfile';
import LigaBadge from '@/components/LigaBadge';
import { SectionTitle } from '@/components/Dashboard/styled';
import {
  AdnChartWrapper,
  LevelBadge,
  RoleNamePrimary,
  CoreRecord,
  CoreRecordValue,
  CoreRecordJoin,
  CoreRecordLabel,
  StatCard,
  StatIcon,
  StatBody,
  StatValue,
  StatLabel,
} from '@/components/PersonajeCard/styled';
import {
  SortTabs,
  SortTab,
  List,
  ListRow,
  RowDate,
  RowName,
  RowStats,
  EmptyState,
} from '@/components/HistorialActividades/styled';
import { InsightList, InsightItem } from '@/components/InsightsSection/styled';
import {
  CardRoot,
  PlainRoot,
  Header,
  Nombre,
  Publicada,
  Badges,
  Body,
  RadarCol,
  DataCol,
  Stats,
  Block,
  BlockHead,
  HeatmapWrap,
} from './styled';

export type HeroCardVariant = 'card' | 'modal';

interface HeroCardProps {
  profile: HeroProfile;
  /**
   * `card` trae su propia superficie; `modal` no, porque el panel del modal ya
   * la pone y una card adentro de otra se lee como dos capas.
   */
  variant?: HeroCardVariant;
  /** ISO 3166-1 alfa-2, si el corredor lo eligió. Vive en el perfil, no en la ficha. */
  pais?: string | null;
  /** Cuándo se publicó la ficha: es una foto, y quien la mira tiene que saber de cuándo. */
  publicadaAt?: string | null;
}

const VACIO_DESTACADAS: Record<DestacadaKey, string> = {
  recientes: 'Sin actividades registradas.',
  largas: 'Sin actividades registradas.',
  rapidas: 'Sin salidas de running con ritmo medido.',
};

function formatFecha(fecha: string): string {
  return parseLocalDate(fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

function statsDe(a: HeroActividad): string {
  const partes = [kmToString(a.distanciaKm)];
  if (a.ritmoSegKm !== null) partes.push(secPerKmToString(a.ritmoSegKm));
  return partes.join(' · ');
}

/**
 * La ficha pública de un corredor: lo que ve un tercero. Recibe la ficha ya
 * calculada (`HeroProfile`) y no sabe de dónde vino: de los datos locales
 * (la vista previa propia) o de la API del club.
 */
const HeroCard: React.FC<HeroCardProps> = ({ profile, variant = 'card', pais, publicadaAt }) => {
  const [orden, setOrden] = useState<DestacadaKey>('recientes');
  const Root = variant === 'card' ? CardRoot : PlainRoot;
  const lista = profile.destacadas[orden];
  const { totales, ultimos90 } = profile;

  return (
    <Root>
      <Header>
        {(profile.nombre || pais) && (
          <Nombre>
            {pais && (
              <span role="img" aria-label={nombrePais(pais)} title={nombrePais(pais)}>
                {banderaPais(pais)}{' '}
              </span>
            )}
            {profile.nombre}
          </Nombre>
        )}
        <RoleNamePrimary>{profile.titulo}</RoleNamePrimary>
        <Badges>
          <LevelBadge>{profile.rama}</LevelBadge>
          <LigaBadge liga={profile.liga} />
        </Badges>
        {profile.mejorMarca && (
          <CoreRecord>
            <CoreRecordValue>
              {profile.mejorMarca.label} <CoreRecordJoin>en</CoreRecordJoin>{' '}
              {formatRecordTime(profile.mejorMarca.timeSeconds)}
            </CoreRecordValue>
            <CoreRecordLabel>su mejor marca</CoreRecordLabel>
          </CoreRecord>
        )}
        {publicadaAt && (
          <Publicada>Actualizada el {new Date(publicadaAt).toLocaleDateString('es-AR')}</Publicada>
        )}
      </Header>

      <Body>
        <RadarCol>
          <AdnChartWrapper>
            <BranchProfile tree={profile.tree} dominantId={profile.ramaId} voz="tercero" />
          </AdnChartWrapper>
        </RadarCol>

        <DataCol>
          <Stats>
            <StatCard>
              <StatIcon><IconRoute size={18} color="currentColor" /></StatIcon>
              <StatBody>
                <StatValue>{Math.round(totales.distanciaKm).toLocaleString('es-AR')}</StatValue>
                <StatLabel $compact>km en total</StatLabel>
              </StatBody>
            </StatCard>
            <StatCard>
              <StatIcon><IconCalendar size={18} color="currentColor" /></StatIcon>
              <StatBody>
                <StatValue>{totales.actividades.toLocaleString('es-AR')}</StatValue>
                <StatLabel $compact>actividades</StatLabel>
              </StatBody>
            </StatCard>
            <StatCard>
              <StatIcon><IconFlame size={18} color="currentColor" /></StatIcon>
              <StatBody>
                <StatValue>{totales.rachaSemanas}</StatValue>
                <StatLabel $compact>semanas seguidas, hoy</StatLabel>
              </StatBody>
            </StatCard>
            <StatCard>
              <StatIcon><IconFlame size={18} color="currentColor" /></StatIcon>
              <StatBody>
                <StatValue>{totales.rachaMasLargaSemanas}</StatValue>
                <StatLabel $compact>semanas, su racha más larga</StatLabel>
              </StatBody>
            </StatCard>
            <StatCard>
              <StatIcon><IconRun size={18} color="currentColor" /></StatIcon>
              <StatBody>
                <StatValue>{Math.round(ultimos90.distanciaKm).toLocaleString('es-AR')}</StatValue>
                <StatLabel $compact>km corridos en {VENTANA_DIAS} días</StatLabel>
              </StatBody>
            </StatCard>
            <StatCard>
              <StatIcon><IconRun size={18} color="currentColor" /></StatIcon>
              <StatBody>
                <StatValue>{ultimos90.ritmoSegKm !== null ? secPerKmToString(ultimos90.ritmoSegKm) : '—'}</StatValue>
                <StatLabel $compact>
                  {ultimos90.ritmoSegKm !== null ? `ritmo medio en ${VENTANA_DIAS} días` : `sin ritmo medido en ${VENTANA_DIAS} días`}
                </StatLabel>
              </StatBody>
            </StatCard>
          </Stats>

          <Block>
            <BlockHead>Últimos {VENTANA_DIAS} días</BlockHead>
            <HeatmapWrap>
              <ActivityHeatmap data={profile.dias90} days={VENTANA_DIAS} />
            </HeatmapWrap>
          </Block>
        </DataCol>
      </Body>

      <Block>
        <SectionTitle as="h3">Actividades</SectionTitle>
        <SortTabs role="group" aria-label="Orden de las actividades destacadas">
          {DESTACADAS.map(d => (
            <SortTab
              key={d.id}
              type="button"
              $active={d.id === orden}
              aria-pressed={d.id === orden}
              onClick={() => setOrden(d.id)}
            >
              {d.label}
            </SortTab>
          ))}
        </SortTabs>
        {lista.length === 0 ? (
          <EmptyState>{VACIO_DESTACADAS[orden]}</EmptyState>
        ) : (
          <List>
            {lista.map((a, i) => (
              <ListRow key={`${orden}-${i}`}>
                <RowDate>{formatFecha(a.fecha)}</RowDate>
                <RowName title={a.nombre}>{a.nombre}</RowName>
                <RowStats>{statsDe(a)}</RowStats>
              </ListRow>
            ))}
          </List>
        )}
      </Block>

      {profile.frases.length > 0 && (
        <Block>
          <SectionTitle as="h3">Lo que dicen sus datos</SectionTitle>
          <InsightList>
            {profile.frases.map(frase => (
              <InsightItem key={frase}>{frase}</InsightItem>
            ))}
          </InsightList>
        </Block>
      )}
    </Root>
  );
};

export default HeroCard;
