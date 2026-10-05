'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import { Activity } from '@/types/activity';
import { ProcessedStats } from '@/types/stats';
import { buildHeroProfile } from '@/lib/heroProfile';
import { useClub } from '@/hooks/useClub';
import HeroCard from '@/components/HeroCard';
import { PageColumn } from '@/components/Dashboard/styled';

const Note = styled.p`
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 1rem;

  a {
    color: var(--accent);
  }
`;

interface HeroViewProps {
  activities: Activity[];
  stats: ProcessedStats;
}

/**
 * La ficha propia tal como la ve otra persona: la versión publicable (sin los
 * nombres de las salidas) y con el nombre del club, no la de la Home.
 */
const HeroView: React.FC<HeroViewProps> = ({ activities, stats }) => {
  const { club } = useClub();
  const perfil = club.estado === 'registrado' ? club.perfil : null;
  const profile = useMemo(
    () => buildHeroProfile(activities, stats, new Date(), perfil?.nombre ?? null, true),
    [activities, stats, perfil?.nombre]
  );

  let nota: React.ReactNode = 'Así ve tu ficha otra persona.';
  if (club.estado === 'sin-registro') {
    nota = (
      <>
        Así la vería otra persona. Todavía no se publicó: <Link href="/profile">sumate al ranking</Link>.
      </>
    );
  } else if (perfil && perfil.visibilidad === 'publica') {
    nota = (
      <>
        Así ve tu ficha otra persona. Este es su link público:{' '}
        <Link href={`/hero/${perfil.enlace}`}>platenzen.com/hero/{perfil.enlace}</Link>. El @usuario se
        elige en tu <Link href="/profile">perfil del club</Link>.
      </>
    );
  } else if (perfil) {
    nota = (
      <>
        Así se vería tu ficha. Hoy no la mostrás: lo podés cambiar en tu <Link href="/profile">perfil del club</Link>.
      </>
    );
  }

  return (
    <PageColumn>
      <div>
        <Note>{nota}</Note>
        <HeroCard profile={profile} pais={perfil?.pais} />
      </div>
    </PageColumn>
  );
};

export default HeroView;
