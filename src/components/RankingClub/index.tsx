'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useStravaData } from '@/hooks/useStravaData';
import { useClub } from '@/hooks/useClub';
import { buildHeroProfile, rankingEntryDe } from '@/lib/heroProfile';
import { RankingEntry } from '@/lib/ranking';
import { obtenerFicha, obtenerRanking } from '@/lib/club/cliente';
import RankingView, { FichaCargada } from '@/components/RankingView';
import { Cta, Notice } from '@/components/RankingView/styled';
import { BotonSecundario } from '@/components/PerfilClub/styled';

/** Id de la fila propia cuando la tabla se arma con los datos locales: no es un id de corredor. */
const ID_LOCAL = 'local';

type EstadoTabla =
  | { estado: 'cargando' }
  | { estado: 'lista'; entries: RankingEntry[] }
  | { estado: 'no-disponible' }
  | { estado: 'error' };

/**
 * El ranking del club, de la API. Si el club no está disponible, la tabla no
 * queda vacía: muestra la fila propia calculada en el dispositivo, y lo dice.
 */
const RankingClub: React.FC = () => {
  const { activities, stats } = useStravaData();
  const { club, publicacion } = useClub();
  const [tabla, setTabla] = useState<EstadoTabla>({ estado: 'cargando' });
  const [intento, setIntento] = useState(0);

  const fichaLocal = useMemo(() => buildHeroProfile(activities, stats), [activities, stats]);

  // Se vuelve a pedir cuando termina una publicación: la fila propia cambia.
  useEffect(() => {
    let vigente = true;
    obtenerRanking('distancia')
      .then(r => {
        if (vigente) setTabla({ estado: 'lista', entries: [...r.ligas.oro, ...r.ligas.plata, ...r.ligas.bronce] });
      })
      .catch(e => {
        if (!vigente) return;
        setTabla(e?.status === 503 ? { estado: 'no-disponible' } : { estado: 'error' });
      });
    return () => {
      vigente = false;
    };
  }, [publicacion, intento]);

  const cargarFicha = useCallback(
    async (id: string): Promise<FichaCargada | null> => {
      if (id === ID_LOCAL) return { profile: fichaLocal };
      const f = await obtenerFicha(id);
      return f
        ? { profile: { ...f.ficha, nombre: f.nombre }, pais: f.pais, publicadaAt: f.publicadaAt, enlace: f.enlace }
        : null;
    },
    [fichaLocal]
  );

  if (tabla.estado === 'cargando') {
    return <RankingView entries={null} cargarFicha={cargarFicha} aviso={<Notice role="status">Cargando el ranking…</Notice>} />;
  }

  if (tabla.estado === 'error') {
    return (
      <RankingView
        entries={null}
        cargarFicha={cargarFicha}
        aviso={
          <Notice role="alert">
            No se pudo cargar el ranking.{' '}
            <BotonSecundario type="button" onClick={() => setIntento(i => i + 1)}>
              Reintentar
            </BotonSecundario>
          </Notice>
        }
      />
    );
  }

  if (tabla.estado === 'no-disponible') {
    return (
      <RankingView
        entries={[{ ...rankingEntryDe(ID_LOCAL, fichaLocal), esPropio: true }]}
        cargarFicha={cargarFicha}
        aviso={
          <Notice role="status">
            El ranking del club no está disponible ahora: ves sólo tu fila, calculada en este
            dispositivo.
          </Notice>
        }
      />
    );
  }

  let aviso: React.ReactNode = null;
  if (club.estado === 'sin-registro') {
    aviso = (
      <Cta>
        Tus números todavía no están en la tabla. <Link href="/profile">Sumate al ranking</Link>
      </Cta>
    );
  } else if (club.estado === 'registrado' && club.perfil.visibilidad === 'oculta') {
    aviso = (
      <Notice role="status">
        Tu perfil está oculto: no aparecés en la tabla. Lo podés cambiar en tu{' '}
        <Link href="/profile">perfil del club</Link>.
      </Notice>
    );
  } else if (club.estado === 'registrado' && publicacion === 'publicando') {
    aviso = <Notice role="status">Actualizando tus números…</Notice>;
  }

  return <RankingView entries={tabla.entries} cargarFicha={cargarFicha} aviso={aviso} />;
};

export default RankingClub;
