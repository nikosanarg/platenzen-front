'use client';

import React from 'react';
import { bottomNavOffset } from 'kaizen-lib/ui';
import { AnimatedToastProvider, MotionProvider } from 'kaizen-lib/motion';

/**
 * Lo que los componentes animados de kaizen-lib necesitan una sola vez, cerca
 * de la raíz: `MotionProvider` (carga `motion` en modo estricto y respeta
 * `prefers-reduced-motion`) y la pila de avisos de `useToast()`.
 *
 * Los avisos salen abajo al centro, por encima de la barra inferior cuando se
 * ve (`bottomNavOffset` vale `0px` donde no está).
 */
export default function ProveedoresUI({ children }: { children: React.ReactNode }) {
  return (
    <MotionProvider>
      <AnimatedToastProvider position="bottom-center" offsetBottom={bottomNavOffset}>
        {children}
      </AnimatedToastProvider>
    </MotionProvider>
  );
}
