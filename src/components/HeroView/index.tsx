'use client';

import React, { useMemo } from 'react';
import styled from 'styled-components';
import { Activity } from '@/types/activity';
import { ProcessedStats } from '@/types/stats';
import { buildHeroProfile } from '@/lib/heroProfile';
import HeroCard from '@/components/HeroCard';
import { PageColumn } from '@/components/Dashboard/styled';

const Note = styled.p`
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 1rem;
`;

interface HeroViewProps {
  activities: Activity[];
  stats: ProcessedStats;
}

/**
 * La ficha propia tal como la vería otra persona. Hoy es la única que existe:
 * las de los demás llegan cuando la API del ranking las publique.
 */
const HeroView: React.FC<HeroViewProps> = ({ activities, stats }) => {
  const profile = useMemo(() => buildHeroProfile(activities, stats), [activities, stats]);

  return (
    <PageColumn>
      <div>
        <Note>Así ve tu ficha otra persona.</Note>
        <HeroCard profile={profile} />
      </div>
    </PageColumn>
  );
};

export default HeroView;
