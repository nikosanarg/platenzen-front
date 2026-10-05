'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styled from 'styled-components';

const Root = styled.main`
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem 1rem 3rem;
`;

const Columna = styled.div`
  width: 100%;
  max-width: 1100px;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const Cabecera = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

const Marca = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--text-primary);
  font-weight: 700;
  text-decoration: none;
`;

const Entrar = styled(Link)`
  font-size: 0.85rem;
  color: var(--accent);
`;

/**
 * El marco de las páginas que se leen sin haber conectado Strava: la ficha
 * pública de un corredor y los acuerdos del club. Sin el dashboard, sin la
 * sesión: sólo la marca y una salida hacia la app.
 */
const PaginaPublica: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Root>
    <Columna>
      <Cabecera>
        <Marca href="/">
          <Image src="/assets/platenzen_logo.png" alt="" width={32} height={32} style={{ borderRadius: 8 }} />
          Platenzen
        </Marca>
        <Entrar href="/">Ir a Platenzen</Entrar>
      </Cabecera>
      {children}
    </Columna>
  </Root>
);

export default PaginaPublica;
