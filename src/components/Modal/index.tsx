'use client';

import React, { useEffect } from 'react';
import { IconClose } from '@/components/Icon';
import { Overlay, Panel_, Head, Title, CloseBtn, Body } from './styled';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** 520px alcanza para una ficha; un mapa necesita más aire. */
  maxWidth?: string;
}

/**
 * El único modal del producto: overlay + panel, `Escape` y click afuera
 * cierran, y el scroll del fondo se bloquea mientras está abierto — sin eso,
 * la lista que sigue debajo del click se sigue moviendo detrás del modal.
 */
const Modal: React.FC<ModalProps> = ({ title, onClose, children, maxWidth = '520px' }) => {
  useEffect(() => {
    const alTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', alTecla);

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', alTecla);
      document.body.style.overflow = overflowPrevio;
    };
  }, [onClose]);

  return (
    <Overlay onClick={onClose}>
      <Panel_ $maxWidth={maxWidth} role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
        <Head>
          <Title>{title}</Title>
          <CloseBtn type="button" onClick={onClose} aria-label="Cerrar">
            <IconClose size={16} color="currentColor" />
          </CloseBtn>
        </Head>
        <Body>{children}</Body>
      </Panel_>
    </Overlay>
  );
};

export default Modal;
