'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Activity } from '@/types/activity';
import { ProcessedStats } from '@/types/stats';
import {
  ErrorClub,
  MiPerfil,
  PerfilEditable,
  aceptarAcuerdos as aceptarAcuerdosApi,
  actualizarPerfil,
  borrarCuenta,
  miPerfil,
  publicar,
  registrarse,
} from '@/lib/club/cliente';
import { construirPublicacion } from '@/lib/club/publicacion';

/**
 * El club desde adentro de la app: si la persona se sumó, con qué perfil, y si
 * sus números ya se publicaron.
 *
 * - `no-disponible`: el servidor no tiene configurado el club (o la API no
 *   responde). Las pantallas lo dicen y no ofrecen nada que no se pueda hacer.
 * - `sin-registro`: la API no la conoce. Es el disparador del alta.
 */
export type EstadoClub =
  | { estado: 'cargando' }
  | { estado: 'no-disponible' }
  | { estado: 'error' }
  | { estado: 'sin-registro' }
  | { estado: 'registrado'; perfil: MiPerfil };

export type EstadoPublicacion = 'inactiva' | 'publicando' | 'publicada' | 'fallo';

interface ClubValor {
  club: EstadoClub;
  publicacion: EstadoPublicacion;
  registrar(perfil: PerfilEditable): Promise<void>;
  actualizar(perfil: PerfilEditable): Promise<void>;
  aceptarAcuerdos(): Promise<void>;
  darseDeBaja(): Promise<void>;
  reintentar(): void;
}

const ClubContext = createContext<ClubValor | null>(null);

/** Los acuerdos aceptados son los vigentes: sin eso no se publica nada. */
export function acuerdosAlDia(perfil: MiPerfil): boolean {
  return perfil.acuerdosVersion === perfil.acuerdosVigentes;
}

function estadoPorError(e: unknown): EstadoClub {
  return e instanceof ErrorClub && e.status === 503 ? { estado: 'no-disponible' } : { estado: 'error' };
}

interface ClubProviderProps {
  obtenerToken: () => Promise<string | null>;
  /** Hasta que el historial no terminó de cargar no hay qué publicar ni a quién preguntar. */
  datosListos: boolean;
  activities: Activity[];
  stats: ProcessedStats;
  children: React.ReactNode;
}

export const ClubProvider: React.FC<ClubProviderProps> = ({
  obtenerToken,
  datosListos,
  activities,
  stats,
  children,
}) => {
  const [club, setClub] = useState<EstadoClub>({ estado: 'cargando' });
  const [publicacion, setPublicacion] = useState<EstadoPublicacion>('inactiva');
  const [intento, setIntento] = useState(0);
  // El historial que ya se publicó: se publica una vez por carga, no en cada render.
  const publicadas = useRef<Activity[] | null>(null);

  useEffect(() => {
    if (!datosListos) return;
    let vigente = true;
    miPerfil(obtenerToken)
      .then(perfil => {
        if (vigente) setClub(perfil ? { estado: 'registrado', perfil } : { estado: 'sin-registro' });
      })
      .catch(e => {
        if (vigente) setClub(estadoPorError(e));
      });
    return () => {
      vigente = false;
    };
  }, [datosListos, obtenerToken, intento]);

  const perfil = club.estado === 'registrado' ? club.perfil : null;
  const puedePublicar = perfil !== null && acuerdosAlDia(perfil);

  useEffect(() => {
    if (!datosListos || !puedePublicar || publicadas.current === activities) return;
    publicadas.current = activities;
    setPublicacion('publicando');
    publicar(construirPublicacion(activities, stats), obtenerToken)
      .then(() => setPublicacion('publicada'))
      .catch(() => {
        // Se reintenta en la próxima carga del historial; no hay nada que el usuario tenga que hacer.
        publicadas.current = null;
        setPublicacion('fallo');
      });
  }, [datosListos, puedePublicar, activities, stats, obtenerToken]);

  const registrar = useCallback(
    async (datos: PerfilEditable) => {
      setClub({ estado: 'registrado', perfil: await registrarse(datos, obtenerToken) });
    },
    [obtenerToken]
  );

  const actualizar = useCallback(
    async (datos: PerfilEditable) => {
      setClub({ estado: 'registrado', perfil: await actualizarPerfil(datos, obtenerToken) });
    },
    [obtenerToken]
  );

  const aceptarAcuerdos = useCallback(async () => {
    setClub({ estado: 'registrado', perfil: await aceptarAcuerdosApi(obtenerToken) });
  }, [obtenerToken]);

  const darseDeBaja = useCallback(async () => {
    await borrarCuenta(obtenerToken);
    publicadas.current = null;
    setPublicacion('inactiva');
    setClub({ estado: 'sin-registro' });
  }, [obtenerToken]);

  const reintentar = useCallback(() => {
    setClub({ estado: 'cargando' });
    setIntento(i => i + 1);
  }, []);

  return (
    <ClubContext.Provider
      value={{ club, publicacion, registrar, actualizar, aceptarAcuerdos, darseDeBaja, reintentar }}
    >
      {children}
    </ClubContext.Provider>
  );
};

export function useClub(): ClubValor {
  const valor = useContext(ClubContext);
  if (!valor) throw new Error('useClub requiere ClubProvider en un layout superior');
  return valor;
}
