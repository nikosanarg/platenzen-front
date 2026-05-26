'use client';

import React, { useState } from 'react';
import { CollapseRoot, CollapseToggle, CollapseIndicator, CollapseBody } from './styled';

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  subtitle,
  defaultOpen = false,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <CollapseRoot>
      <CollapseToggle onClick={() => setOpen((v) => !v)}>
        <div>
          <div className="col-title">{title}</div>
          {subtitle && <div className="col-subtitle">{subtitle}</div>}
        </div>
        <CollapseIndicator $open={open}>▼</CollapseIndicator>
      </CollapseToggle>
      {open && <CollapseBody>{children}</CollapseBody>}
    </CollapseRoot>
  );
};

export default CollapsibleSection;
