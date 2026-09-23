'use client';

import React from 'react';
import { IconChevronDown, IconChevronUp } from '@/components/Icon';
import {
  RoleNamePrimary,
  RoleDropdown,
  RoleDropdownTrigger,
  RoleDropdownList,
  RoleDropdownOptionButton,
} from './styled';

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
 */
const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ selectedId, selectedLabel, options, onSelect }) => {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (options.length <= 1) {
    return <RoleNamePrimary>{selectedLabel}</RoleNamePrimary>;
  }

  return (
    <RoleDropdown ref={rootRef}>
      <RoleDropdownTrigger
        type="button"
        $interactive
        $open={open}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        {selectedLabel}
        {open
          ? <IconChevronUp size={20} color="var(--border-light)" />
          : <IconChevronDown size={20} color="var(--border-light)" />}
      </RoleDropdownTrigger>

      {open && (
        <RoleDropdownList role="listbox">
          {options.map(opt => (
            <li key={opt.id} role="option" aria-selected={opt.id === selectedId}>
              <RoleDropdownOptionButton
                type="button"
                $active={opt.id === selectedId}
                onClick={() => {
                  onSelect(opt.id);
                  setOpen(false);
                }}
              >
                {opt.label} ({Math.round(opt.pct)}%)
              </RoleDropdownOptionButton>
            </li>
          ))}
        </RoleDropdownList>
      )}
    </RoleDropdown>
  );
};

export default RoleSwitcher;
