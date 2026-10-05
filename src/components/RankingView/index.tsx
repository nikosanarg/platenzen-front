'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from 'kaizen-lib/ui';
import { HeroProfile } from '@/lib/heroProfile';
import {
  LIGAS,
  RANKING_SORTS,
  RankingEntry,
  RankingSortKey,
  VENTANA_DIAS,
  sortRanking,
} from '@/lib/ranking';
import { banderaPais, nombrePais } from '@/lib/paises';
import { secPerKmToString } from '@/utils/pace';
import HeroCard from '@/components/HeroCard';
import LigaBadge from '@/components/LigaBadge';
import { PageColumn, SectionTitle } from '@/components/Dashboard/styled';
import { SortTabs, SortTab } from '@/components/HistorialActividades/styled';
import {
  Root,
  Intro,
  LigaSection,
  LigaHead,
  LigaCriterio,
  TableWrap,
  Table,
  Th,
  Td,
  NameButton,
  EmptyLiga,
  Propia,
  Fila,
  EstadoModal,
} from './styled';

/** Una ficha lista para el modal, con lo que vive fuera de ella. */
export interface FichaCargada {
  profile: HeroProfile;
  pais?: string | null;
  publicadaAt?: string | null;
}

interface RankingViewProps {
  /** `null` mientras no hay tabla (cargando, error): sin ligas vacías que digan "nadie" sin saberlo. */
  entries: RankingEntry[] | null;
  /** La ficha de un corredor; `null` si no existe o no la muestra. */
  cargarFicha: (id: string) => Promise<FichaCargada | null>;
  /** Lo que va entre la explicación y la tabla: avisos y la invitación a sumarse. */
  aviso?: React.ReactNode;
}

type EstadoFicha =
  | { estado: 'cerrada' }
  | { estado: 'cargando'; id: string }
  | { estado: 'lista'; id: string; ficha: FichaCargada }
  | { estado: 'no-disponible'; id: string };

/**
 * El ranking del club por ligas. Cada liga se ordena por separado: comparar
 * la distancia de alguien con 20 semanas seguidas contra la de alguien que
 * arrancó la semana pasada no dice nada de ninguno de los dos.
 *
 * El orden se resuelve acá con `sortRanking`, la misma regla que usa la API:
 * cambiar de orden no vuelve a pedir nada.
 */
const RankingView: React.FC<RankingViewProps> = ({ entries, cargarFicha, aviso }) => {
  const [orden, setOrden] = useState<RankingSortKey>('distancia');
  const [ficha, setFicha] = useState<EstadoFicha>({ estado: 'cerrada' });

  const porLiga = useMemo(() => {
    const ordenadas = sortRanking(entries ?? [], orden);
    return LIGAS.map(liga => ({ ...liga, filas: ordenadas.filter(e => e.liga === liga.id) }));
  }, [entries, orden]);

  const abiertoId = ficha.estado === 'cerrada' ? null : ficha.id;

  useEffect(() => {
    if (!abiertoId) return;
    let vigente = true;
    cargarFicha(abiertoId)
      .then(f => {
        if (!vigente) return;
        setFicha(f ? { estado: 'lista', id: abiertoId, ficha: f } : { estado: 'no-disponible', id: abiertoId });
      })
      .catch(() => {
        if (vigente) setFicha({ estado: 'no-disponible', id: abiertoId });
      });
    return () => {
      vigente = false;
    };
  }, [abiertoId, cargarFicha]);

  const nombreDe = (e: RankingEntry) => e.nombre ?? (e.esPropio ? 'Vos' : 'Sin nombre');
  // Sin el dato, la fila se puede abrir: es la propia armada con datos locales.
  const abre = (e: RankingEntry) => e.fichaVisible !== false;

  return (
    <PageColumn>
      <Root>
        <SectionTitle>Ranking</SectionTitle>
        <Intro>
          Últimos {VENTANA_DIAS} días, sólo running. La liga sale de las semanas seguidas con al
          menos una actividad de cualquier deporte.
        </Intro>
        {aviso}

        {entries !== null && (
          <>
            <SortTabs role="group" aria-label="Orden del ranking">
              {RANKING_SORTS.map(s => (
                <SortTab
                  key={s.id}
                  type="button"
                  $active={s.id === orden}
                  aria-pressed={s.id === orden}
                  onClick={() => setOrden(s.id)}
                >
                  {s.label}
                </SortTab>
              ))}
            </SortTabs>

            {porLiga.map(liga => (
              <LigaSection key={liga.id} aria-labelledby={`liga-${liga.id}`}>
                <LigaHead id={`liga-${liga.id}`}>
                  <LigaBadge liga={liga.id} />
                  <LigaCriterio>{liga.criterio}</LigaCriterio>
                </LigaHead>

                {liga.filas.length === 0 ? (
                  <EmptyLiga>Nadie en esta liga todavía.</EmptyLiga>
                ) : (
                  <TableWrap>
                    <Table>
                      <thead>
                        <tr>
                          <Th scope="col">#</Th>
                          <Th scope="col">Corredor</Th>
                          <Th scope="col" $num $optional>Semanas</Th>
                          <Th scope="col" $num>Km</Th>
                          <Th scope="col" $num>Ritmo</Th>
                          <Th scope="col" $num>Salidas</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {liga.filas.map((e, i) => (
                          <Fila key={e.id} $propia={e.esPropio === true}>
                            <Td $num>{i + 1}</Td>
                            <Td>
                              {e.pais && (
                                <span role="img" aria-label={nombrePais(e.pais)} title={nombrePais(e.pais)}>
                                  {banderaPais(e.pais)}{' '}
                                </span>
                              )}
                              {abre(e) ? (
                                <NameButton
                                  type="button"
                                  onClick={() => setFicha({ estado: 'cargando', id: e.id })}
                                  aria-label={`Ver la ficha de ${nombreDe(e)}`}
                                >
                                  {nombreDe(e)}
                                </NameButton>
                              ) : (
                                nombreDe(e)
                              )}
                              {e.esPropio && e.nombre && <Propia> (vos)</Propia>}
                            </Td>
                            <Td $num $optional>{e.rachaSemanas}</Td>
                            <Td $num>{Math.round(e.distanciaKm).toLocaleString('es-AR')}</Td>
                            <Td $num>{e.ritmoSegKm !== null ? secPerKmToString(e.ritmoSegKm) : '—'}</Td>
                            <Td $num>{e.actividades}</Td>
                          </Fila>
                        ))}
                      </tbody>
                    </Table>
                  </TableWrap>
                )}
              </LigaSection>
            ))}
          </>
        )}

        <Modal
          open={ficha.estado !== 'cerrada'}
          onClose={() => setFicha({ estado: 'cerrada' })}
          ariaLabel="Ficha del corredor"
          size="lg"
        >
          {ficha.estado === 'cargando' && <EstadoModal role="status">Cargando la ficha…</EstadoModal>}
          {ficha.estado === 'no-disponible' && (
            <EstadoModal role="status">Esta ficha no está disponible.</EstadoModal>
          )}
          {ficha.estado === 'lista' && (
            <HeroCard
              profile={ficha.ficha.profile}
              pais={ficha.ficha.pais}
              publicadaAt={ficha.ficha.publicadaAt}
              variant="modal"
            />
          )}
        </Modal>
      </Root>
    </PageColumn>
  );
};

export default RankingView;
