'use client';

import React from 'react';
import { Menu } from 'kaizen-lib/ui';
import { IconChevronDown } from '@/components/Icon';
import { RoleNamePrimary, RoleDropdownTrigger } from './styled';

export interface RoleSwitcherOption {
  id: string;
  label: string;
  pct: number;
}

interface RoleSwitcherProps {
  selectedId: string;
  selectedLabel: string;
  options: RoleSwitcherOption[];
  onSelect: (id: string) => void;
}

/**
 * El título ("Veintiunero") como selector: cuando hay más de una rama en el
 * mismo nivel, elegir cuál mostrar deja de ser un botón aparte ("Cambiar a
 * X") y pasa a ser esto mismo, desplegado. Sin otra rama con la que
 * empatar, es sólo el título — sin borde, sin flecha, no hay nada que abrir.
 *
 * Es el `Menu` de kaizen-lib y no su `Select`: el disparador tiene que seguir
 * siendo el título (sólo el nombre, sin el porcentaje), y `Select` muestra la
 * etiqueta entera de la opción elegida. La rama actual va con tilde y
 * deshabilitada: elegirla otra vez no cambiaría nada.
 */
const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ selectedId, selectedLabel, options, onSelect }) => {
  if (options.length <= 1) {
    return <RoleNamePrimary>{selectedLabel}</RoleNamePrimary>;
  }

  return (
    <Menu
      align="start"
      trigger={
        <RoleDropdownTrigger type="button">
          {selectedLabel}
          <IconChevronDown size={20} color="var(--border-light)" />
        </RoleDropdownTrigger>
      }
      items={options.map(opt => ({
        label: `${opt.label} (${Math.round(opt.pct)}%)`,
        onSelect: () => onSelect(opt.id),
        disabled: opt.id === selectedId,
        icon: opt.id === selectedId ? <Tilde /> : undefined,
      }))}
    />
  );
};

const Tilde = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--gold)" strokeWidth="2" aria-hidden="true">
    <path d="m3 8.5 3 3 7-7" />
  </svg>
);

export default RoleSwitcher;
