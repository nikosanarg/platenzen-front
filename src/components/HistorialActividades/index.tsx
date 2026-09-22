'use client';

import React, { useMemo, useState } from 'react';
import { Activity } from '@/types/activity';
import { ACTIVITY_SORTS, ActivitySortKey, sortActivities } from '@/lib/activityHistory';
import { formatDistance } from '@/utils/units';
import { secPerKmToString, mpsToSecPerKm } from '@/utils/pace';
import { isRunning } from '@/lib/sports';
import { SectionTitle } from '@/components/Dashboard/styled';
import {
  Root,
  Head,
  SortTabs,
  SortTab,
  List,
  ListRow,
  RowDate,
  RowName,
  RowStats,
  MoreRow,
  MoreButton,
  EmptyState,
} from './styled';

/**
 * El historial completo, en lista: a diferencia de "Récords" (hitos) y
 * "Sesiones legendarias" (momentos), acá no hay criterio de selección — están
 * todas, y el corredor elige el orden. Vive angosta, al lado del bloque de
 * impacto del coach, así que es una fila por salida, no una tarjeta.
 *
 * Se muestran de a tandas porque el historial entero son cientos de filas y
 * pintarlas todas de entrada convierte la card en una lista infinita.
 *
 * `pageSize` y `sorts` son configurables porque el coach la embebe con otro
 * tamaño por defecto (10, no 12) y sin el orden por desnivel — ver
 * `CoachAnalisis`.
 */
const TANDA = 12;

interface HistorialActividadesProps {
  activities: Activity[];
  pageSize?: number;
  sorts?: readonly ActivitySortKey[];
  title?: string;
  /** El coach ya pone su propio título con su propio estilo; acá se apaga el genérico. */
  showTitle?: boolean;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

function statsDe(activity: Activity): string {
  const partes = [formatDistance(activity.distance)];
  if (isRunning(activity) && activity.average_speed > 0) {
    partes.push(secPerKmToString(mpsToSecPerKm(activity.average_speed)));
  }
  return partes.join(' · ');
}

const HistorialActividades: React.FC<HistorialActividadesProps> = ({
  activities,
  pageSize = TANDA,
  sorts,
  title = 'Actividades',
  showTitle = true,
}) => {
  const opciones = sorts ? ACTIVITY_SORTS.filter(s => sorts.includes(s.id)) : ACTIVITY_SORTS;
  const [orden, setOrden] = useState<ActivitySortKey>(opciones[0].id);
  const [visibles, setVisibles] = useState(pageSize);

  const ordenadas = useMemo(
    () => sortActivities(activities, orden),
    [activities, orden]
  );

  const mostradas = ordenadas.slice(0, visibles);
  const restantes = ordenadas.length - mostradas.length;

  return (
    <Root>
      <Head>
        {showTitle && <SectionTitle>{title}</SectionTitle>}
        <SortTabs role="group" aria-label="Orden del historial">
          {opciones.map(s => (
            <SortTab
              key={s.id}
              type="button"
              $active={s.id === orden}
              aria-pressed={s.id === orden}
              onClick={() => {
                setOrden(s.id);
                // Cambiar el orden reencuadra la lista: seguir en la tanda 4
                // mostraría el medio de un ranking que el corredor no vio.
                setVisibles(pageSize);
              }}
            >
              {s.label}
            </SortTab>
          ))}
        </SortTabs>
      </Head>

      {ordenadas.length === 0 ? (
        <EmptyState>Todavía no hay actividades en tu historial.</EmptyState>
      ) : (
        <>
          <List>
            {mostradas.map(activity => (
              <ListRow key={`${activity.provider}-${activity.externalId}`}>
                <RowDate>{formatDate(activity.start_date_local)}</RowDate>
                <RowName title={activity.name}>{activity.name}</RowName>
                <RowStats>{statsDe(activity)}</RowStats>
              </ListRow>
            ))}
          </List>

          {restantes > 0 && (
            <MoreRow>
              <MoreButton type="button" onClick={() => setVisibles(v => v + pageSize)}>
                Ver {Math.min(restantes, pageSize)} más · quedan {restantes}
              </MoreButton>
            </MoreRow>
          )}
        </>
      )}
    </Root>
  );
};

export default HistorialActividades;
