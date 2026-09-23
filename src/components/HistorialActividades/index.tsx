'use client';

import React, { useMemo, useState } from 'react';
import { Activity } from '@/types/activity';
import { ACTIVITY_SORTS, ActivitySortKey, sortActivities } from '@/lib/activityHistory';
import { formatDistance } from '@/utils/units';
import { secPerKmToString, mpsToSecPerKm } from '@/utils/pace';
import { isRunning } from '@/lib/sports';
import { parseLocalDate } from '@/utils/localDate';
import { SectionTitle } from '@/components/Dashboard/styled';
import { IconChevronUp } from '@/components/Icon';
import {
  Root,
  Head,
  ToggleTitle,
  SortTabs,
  SortTab,
  Collapsible,
  CollapsibleInner,
  List,
  ListRow,
  RowDate,
  RowName,
  RowStats,
  Paginator,
  PageNavButton,
  PageButton,
  PageEllipsis,
  CollapseButton,
  EmptyState,
} from './styled';

/**
 * Colapsada la primera vez que se ve: el historial completo no es lo
 * primero que hace falta leer de la card del coach. Una vez que el
 * corredor la abre, queda abierta — también al volver de otra tab de la
 * app, aunque eso desmonte y remonte el componente — así que el estado
 * vive en `localStorage`, no en el estado de React.
 */
const STORAGE_KEY = 'platenzen.historialActividades.abierto';

function leerAbiertoGuardado(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function guardarAbierto(abierto: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, abierto ? '1' : '0');
  } catch {
    // localStorage puede fallar (modo privado, cuota): la sección simplemente no recuerda.
  }
}

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
  const d = parseLocalDate(dateStr);
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
  const [abiertoState, setAbiertoState] = useState(leerAbiertoGuardado);
  // Sin título no hay control para colapsar: se muestra siempre entera.
  const abierto = showTitle ? abiertoState : true;

  const abrir = () => {
    setAbiertoState(true);
    guardarAbierto(true);
  };

  const colapsar = () => {
    setAbiertoState(false);
    guardarAbierto(false);
  };

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
        {showTitle && (
          abierto ? (
            <SectionTitle>{title}</SectionTitle>
          ) : (
            <ToggleTitle type="button" onClick={abrir} aria-expanded="false">
              Ver {title.toLowerCase()}
            </ToggleTitle>
          )
        )}
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
                // Elegir un orden desde colapsado también abre la lista: el
                // filtro se aplica y se ve, no queda seleccionado a ciegas.
                abrir();
              }}
            >
              {s.label}
            </SortTab>
          ))}
        </SortTabs>
      </Head>

      <Collapsible $open={abierto}>
        {/*
          Siempre montado, nunca condicionado a `abierto`: la transición de
          `grid-template-rows` (0fr → 1fr) es lo que la muestra u oculta.
          Desmontarla de un salto perdería la animación.
        */}
        <CollapsibleInner inert={abierto ? undefined : true}>
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

              {showTitle && (
                <CollapseButton type="button" onClick={colapsar} aria-label="Colapsar actividades" aria-expanded="true">
                  <IconChevronUp size={14} />
                </CollapseButton>
              )}
            </>
          )}
        </CollapsibleInner>
      </Collapsible>
    </Root>
  );
};

export default HistorialActividades;
