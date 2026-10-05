'use client';

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { FichaPublica as Ficha, obtenerFicha } from '@/lib/club/cliente';
import HeroCard from '@/components/HeroCard';

const Estado = styled.p`
  padding: 3rem 0;
  text-align: center;
  font-size: 0.95rem;
  color: var(--text-muted);
`;

type EstadoFicha =
  | { estado: 'cargando' }
  | { estado: 'lista'; ficha: Ficha }
  | { estado: 'no-existe' }
  | { estado: 'error' };

/**
 * La ficha de un corredor para quien llega por un link, sin haber conectado
 * nada. "No existe" y "no la muestra" se dicen igual a propósito: decir cuál
 * de las dos es ya contaría algo de alguien que eligió no mostrarse.
 */
const FichaPublica: React.FC<{ id: string }> = ({ id }) => {
  const [estado, setEstado] = useState<EstadoFicha>({ estado: 'cargando' });

  useEffect(() => {
    let vigente = true;
    obtenerFicha(id)
      .then(ficha => {
        if (vigente) setEstado(ficha ? { estado: 'lista', ficha } : { estado: 'no-existe' });
      })
      .catch(() => {
        if (vigente) setEstado({ estado: 'error' });
      });
    return () => {
      vigente = false;
    };
  }, [id]);

  if (estado.estado === 'cargando') return <Estado role="status">Cargando la ficha…</Estado>;
  if (estado.estado === 'no-existe') return <Estado>Esta ficha no existe o no es pública.</Estado>;
  if (estado.estado === 'error') return <Estado role="alert">No se pudo cargar la ficha. Probá más tarde.</Estado>;

  const { ficha } = estado;
  return (
    <HeroCard
      profile={{ ...ficha.ficha, nombre: ficha.nombre }}
      pais={ficha.pais}
      publicadaAt={ficha.publicadaAt}
    />
  );
};

export default FichaPublica;
