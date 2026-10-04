'use client';

import React from 'react';
import styled from 'styled-components';
import { LIGAS, Liga } from '@/lib/ranking';

const COLOR_RGB: Record<Liga, string> = {
  oro: 'var(--gold-rgb)',
  plata: 'var(--silver-rgb)',
  bronce: 'var(--bronze-rgb)',
};

const Pill = styled.span<{ $liga: Liga }>`
  display: inline-flex;
  align-items: center;
  font-size: calc(0.72rem + 2px);
  font-weight: 600;
  letter-spacing: 0.03em;
  white-space: nowrap;
  border-radius: 999px;
  padding: 0.2rem 0.7rem;
  color: rgb(${({ $liga }) => COLOR_RGB[$liga]});
  background: rgba(${({ $liga }) => COLOR_RGB[$liga]}, 0.12);
  border: 1px solid rgb(${({ $liga }) => COLOR_RGB[$liga]});
`;

/** La liga se nombra siempre: el color solo no dice en cuál está. */
const LigaBadge: React.FC<{ liga: Liga }> = ({ liga }) => (
  <Pill $liga={liga}>{LIGAS.find(l => l.id === liga)!.label}</Pill>
);

export default LigaBadge;
