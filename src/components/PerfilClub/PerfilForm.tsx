'use client';

import React, { useId, useMemo, useState } from 'react';
import Link from 'next/link';
import { ErrorClub, PerfilEditable, Visibilidad } from '@/lib/club/cliente';
import { paisesOrdenados } from '@/lib/paises';
import {
  Ayuda,
  Boton,
  Campo,
  Check,
  MensajeError,
  Etiqueta,
  Form,
  Input,
  Leyenda,
  Opcion,
  Opciones,
  Select,
} from './styled';

export const VISIBILIDADES: readonly { id: Visibilidad; titulo: string; detalle: string }[] = [
  { id: 'publica', titulo: 'Pública', detalle: 'Aparecés en el ranking y cualquiera puede abrir tu ficha.' },
  {
    id: 'solo_ranking',
    titulo: 'Sólo en el ranking',
    detalle: 'Aparece tu fila con tus números, pero tu ficha no se abre.',
  },
  {
    id: 'oculta',
    titulo: 'Oculta',
    detalle: 'No aparecés en ningún lado. Tus números se siguen guardando para que puedas volver a mostrarte.',
  },
];

/** Lo que la pantalla le dice a la persona para cada código de la API. */
export function mensajeDeError(e: unknown): string {
  if (!(e instanceof ErrorClub)) return 'No se pudo guardar. Probá de nuevo.';
  switch (e.code) {
    case 'NOMBRE_INVALIDO':
      return 'El nombre tiene que tener entre 3 y 30 caracteres: letras, números, espacios, puntos, guiones o guiones bajos.';
    case 'NOMBRE_EN_USO':
      return 'Ese nombre ya lo eligió otro corredor.';
    case 'PAIS_INVALIDO':
      return 'Elegí un país de la lista.';
    case 'CLUB_NO_DISPONIBLE':
      return 'El club no está disponible en este momento. Probá más tarde.';
    default:
      return 'No se pudo guardar. Probá de nuevo.';
  }
}

interface PerfilFormProps {
  inicial: PerfilEditable;
  /** El nombre que se muestra si no se elige uno. Antes del alta todavía no existe. */
  alias: string | null;
  textoBoton: string;
  /** El alta exige aceptar los acuerdos; la edición no. */
  pedirAcuerdos: boolean;
  onSubmit(perfil: PerfilEditable): Promise<void>;
}

const PerfilForm: React.FC<PerfilFormProps> = ({ inicial, alias, textoBoton, pedirAcuerdos, onSubmit }) => {
  const id = useId();
  const [nombre, setNombre] = useState(inicial.nombreVisible ?? '');
  const [pais, setPais] = useState(inicial.pais ?? '');
  const [visibilidad, setVisibilidad] = useState<Visibilidad>(inicial.visibilidad);
  const [acepta, setAcepta] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const paises = useMemo(() => paisesOrdenados(), []);

  const bloqueado = enviando || (pedirAcuerdos && !acepta);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bloqueado) return;
    setEnviando(true);
    setError(null);
    try {
      await onSubmit({ nombreVisible: nombre.trim() || null, pais: pais || null, visibilidad });
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Form onSubmit={enviar} noValidate>
      <Campo>
        <Etiqueta htmlFor={`${id}-nombre`}>Nombre visible</Etiqueta>
        <Input
          id={`${id}-nombre`}
          value={nombre}
          maxLength={30}
          autoComplete="nickname"
          placeholder={alias ?? 'Opcional'}
          onChange={e => setNombre(e.target.value)}
        />
        <Ayuda>
          {alias
            ? `Si lo dejás vacío, aparecés como ${alias}.`
            : 'Si lo dejás vacío, te asignamos un nombre al azar, como "pepino357619".'}{' '}
          No hace falta que sea tu nombre real.
        </Ayuda>
      </Campo>

      <Campo>
        <Etiqueta htmlFor={`${id}-pais`}>País</Etiqueta>
        <Select id={`${id}-pais`} value={pais} onChange={e => setPais(e.target.value)}>
          <option value="">Sin especificar</option>
          {paises.map(p => (
            <option key={p.codigo} value={p.codigo}>
              {p.nombre}
            </option>
          ))}
        </Select>
      </Campo>

      <Opciones>
        <Leyenda>Privacidad</Leyenda>
        {VISIBILIDADES.map(v => (
          <Opcion key={v.id} $activa={visibilidad === v.id}>
            <input
              type="radio"
              name={`${id}-visibilidad`}
              value={v.id}
              checked={visibilidad === v.id}
              onChange={() => setVisibilidad(v.id)}
            />
            <span>
              <strong>{v.titulo}.</strong> {v.detalle}
            </span>
          </Opcion>
        ))}
      </Opciones>

      {pedirAcuerdos && (
        <Check>
          <input type="checkbox" checked={acepta} onChange={e => setAcepta(e.target.checked)} />
          <span>
            Leí y acepto los{' '}
            <Link href="/acuerdos" target="_blank" rel="noopener">
              acuerdos del club
            </Link>
            .
          </span>
        </Check>
      )}

      {error && <MensajeError role="alert">{error}</MensajeError>}

      <Boton as="button" type="submit" disabled={bloqueado} aria-busy={enviando}>
        {enviando ? 'Guardando…' : textoBoton}
      </Boton>
    </Form>
  );
};

export default PerfilForm;
