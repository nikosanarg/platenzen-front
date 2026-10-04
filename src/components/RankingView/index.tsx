'use client';

import React, { useMemo, useState } from 'react';
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
import { secPerKmToString } from '@/utils/pace';
import HeroCard from '@/components/HeroCard';
import LigaBadge from '@/components/LigaBadge';
import { PageColumn, SectionTitle } from '@/components/Dashboard/styled';
import { SortTabs, SortTab } from '@/components/HistorialActividades/styled';
import {
  Root,
  Intro,
  Notice,
  LigaSection,
  LigaHead,
  LigaCriterio,
  TableWrap,
  Table,
  Th,
  Td,
  NameButton,
  EmptyLiga,
} from './styled';

interface RankingViewProps {
  entries: RankingEntry[];
  /** La fila de quien mira: se nombra "Vos" cuando no trae nombre. */
  propioId?: string;
  /** La ficha de un corredor, si está disponible. Sin ficha, la fila no abre nada. */
  fichaDe: (id: string) => HeroProfile | undefined;
}

/**
 * El ranking del club por ligas. Cada liga se ordena por separado: comparar
 * la distancia de alguien con 20 semanas seguidas contra la de alguien que
 * arrancó la semana pasada no dice nada de ninguno de los dos.
 */
const RankingView: React.FC<RankingViewProps> = ({ entries, propioId, fichaDe }) => {
  const [orden, setOrden] = useState<RankingSortKey>('distancia');
  const [abiertoId, setAbiertoId] = useState<string | null>(null);

  const porLiga = useMemo(() => {
    const ordenadas = sortRanking(entries, orden);
    return LIGAS.map(liga => ({ ...liga, filas: ordenadas.filter(e => e.liga === liga.id) }));
  }, [entries, orden]);

  const soloPropia = entries.length === 1 && entries[0].id === propioId;
  const fichaAbierta = abiertoId ? fichaDe(abiertoId) : undefined;
  const nombreDe = (e: RankingEntry) => e.nombre ?? (e.id === propioId ? 'Vos' : 'Sin nombre');

  return (
    <PageColumn>
      <Root>
        <SectionTitle>Ranking</SectionTitle>
        <Intro>
          Últimos {VENTANA_DIAS} días, sólo running. La liga sale de las semanas seguidas con al
          menos una actividad de cualquier deporte.
        </Intro>
        {soloPropia && (
          <Notice role="status">
            Las fichas del resto del club todavía no se publican: por ahora la tabla muestra sólo
            la tuya.
          </Notice>
        )}

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
                      <tr key={e.id}>
                        <Td $num>{i + 1}</Td>
                        <Td>
                          {fichaDe(e.id) ? (
                            <NameButton
                              type="button"
                              onClick={() => setAbiertoId(e.id)}
                              aria-label={`Ver la ficha de ${nombreDe(e)}`}
                            >
                              {nombreDe(e)}
                            </NameButton>
                          ) : (
                            nombreDe(e)
                          )}
                        </Td>
                        <Td $num $optional>{e.rachaSemanas}</Td>
                        <Td $num>{Math.round(e.distanciaKm).toLocaleString('es-AR')}</Td>
                        <Td $num>{e.ritmoSegKm !== null ? secPerKmToString(e.ritmoSegKm) : '—'}</Td>
                        <Td $num>{e.actividades}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            )}
          </LigaSection>
        ))}

        <Modal
          open={fichaAbierta !== undefined}
          onClose={() => setAbiertoId(null)}
          ariaLabel="Ficha del corredor"
          size="lg"
        >
          {fichaAbierta && <HeroCard profile={fichaAbierta} variant="modal" />}
        </Modal>
      </Root>
    </PageColumn>
  );
};

export default RankingView;
