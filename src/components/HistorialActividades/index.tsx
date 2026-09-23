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
  Paginator,
  PageNavButton,
  PageButton,
  PageEllipsis,
  EmptyState,
} from './styled';

/**
 * El historial completo, en lista: a diferencia de "Récords" (hitos) y
 * "Sesiones legendarias" (momentos), acá no hay criterio de selección — están
 * todas, y el corredor elige el orden. Vive angosta, al lado del bloque de
 * impacto del coach, así que es una fila por salida, no una tarjeta.
 *
 * Se pagina porque el historial entero son cientos de filas y pintarlas
 * todas de entrada convierte la card en una lista infinita.
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

/**
 * Qué números mostrar en el paginador: siempre la primera, la última y un
 * entorno de la actual, con "…" donde el salto no es consecutivo — así una
 * lista de 100 páginas no dibuja 100 botones.
 */
function rangoPaginas(actual: number, total: number): (number | 'ellipsis')[] {
  const centrales = [actual - 1, actual, actual + 1].filter(p => p >= 1 && p <= total);
  const paginas = [...new Set([1, ...centrales, total])].sort((a, b) => a - b);

  return paginas.flatMap((p, i) => {
    const anterior = paginas[i - 1];
    return anterior !== undefined && p - anterior > 1 ? ['ellipsis' as const, p] : [p];
  });
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
  const [pagina, setPagina] = useState(1);

  const ordenadas = useMemo(
    () => sortActivities(activities, orden),
    [activities, orden]
  );

  const totalPaginas = Math.max(1, Math.ceil(ordenadas.length / pageSize));
  const paginaActual = Math.min(pagina, totalPaginas);
  const mostradas = ordenadas.slice((paginaActual - 1) * pageSize, paginaActual * pageSize);

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
                // Cambiar el orden reencuadra la lista: seguir en la página 4
                // mostraría el medio de un ranking que el corredor no vio.
                setPagina(1);
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

          {totalPaginas > 1 && (
            <Paginator aria-label="Paginación del historial">
              <PageNavButton
                type="button"
                aria-label="Página anterior"
                disabled={paginaActual === 1}
                onClick={() => setPagina(p => p - 1)}
              >
                ‹
              </PageNavButton>

              {rangoPaginas(paginaActual, totalPaginas).map((p, i) =>
                p === 'ellipsis' ? (
                  <PageEllipsis key={`ellipsis-${i}`} aria-hidden="true">…</PageEllipsis>
                ) : (
                  <PageButton
                    key={p}
                    type="button"
                    $active={p === paginaActual}
                    aria-label={`Página ${p}`}
                    aria-current={p === paginaActual ? 'page' : undefined}
                    onClick={() => setPagina(p)}
                  >
                    {p}
                  </PageButton>
                )
              )}

              <PageNavButton
                type="button"
                aria-label="Página siguiente"
                disabled={paginaActual === totalPaginas}
                onClick={() => setPagina(p => p + 1)}
              >
                ›
              </PageNavButton>
            </Paginator>
          )}
        </>
      )}
    </Root>
  );
};

export default HistorialActividades;
