'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Modal } from 'kaizen-lib/ui';
import { useClub, acuerdosAlDia } from '@/hooks/useClub';
import { SectionTitle } from '@/components/Dashboard/styled';
import PerfilForm, { mensajeDeError } from './PerfilForm';
import {
  Acciones,
  Aviso,
  BotonPeligro,
  BotonSecundario,
  MensajeError,
  Estado,
  Lead,
  Lista,
  Root,
  Separador,
} from './styled';

const QUE_SE_PUBLICA = (
  <Lista>
    <li>Tu ficha: título, mejor marca, radar, totales, racha y las frases sobre tus datos.</li>
    <li>Tus kilómetros, salidas y ritmo de running por día, de los últimos 90 días.</li>
    <li>Qué semanas tuviste actividad, para calcular tu racha y tu liga.</li>
    <li>
      <strong>No se publica</strong>: ningún recorrido ni mapa, ni el nombre de tus salidas, ni tus
      datos de cuenta de Strava.
    </li>
  </Lista>
);

/**
 * El perfil del club: el alta para quien no está, la configuración para quien
 * sí. Todo lo que un corredor decide sobre cómo lo ven los demás vive acá.
 */
const PerfilClub: React.FC = () => {
  const { club, publicacion, registrar, actualizar, aceptarAcuerdos, darseDeBaja, reintentar } = useClub();
  const [confirmandoBaja, setConfirmandoBaja] = useState(false);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  /** `true` si la acción salió bien; si no, deja el mensaje a la vista. */
  const correr = async (accion: () => Promise<void>): Promise<boolean> => {
    setOcupado(true);
    setErrorAccion(null);
    try {
      await accion();
      return true;
    } catch (e) {
      setErrorAccion(mensajeDeError(e));
      return false;
    } finally {
      setOcupado(false);
    }
  };

  if (club.estado === 'cargando') {
    return (
      <Root>
        <SectionTitle>Perfil del club</SectionTitle>
        <Estado role="status">Cargando tu perfil…</Estado>
      </Root>
    );
  }

  if (club.estado === 'no-disponible') {
    return (
      <Root>
        <SectionTitle>Perfil del club</SectionTitle>
        <Lead>El club no está disponible en este momento. Tus estadísticas siguen funcionando igual.</Lead>
      </Root>
    );
  }

  if (club.estado === 'error') {
    return (
      <Root>
        <SectionTitle>Perfil del club</SectionTitle>
        <Lead>No se pudo consultar tu perfil.</Lead>
        <BotonSecundario type="button" onClick={reintentar}>
          Reintentar
        </BotonSecundario>
      </Root>
    );
  }

  if (club.estado === 'sin-registro') {
    return (
      <Root>
        <SectionTitle>Sumate al ranking del club</SectionTitle>
        <Lead>
          Tu historial sigue guardado sólo en este dispositivo. Si te sumás, publicamos números
          calculados a partir de él, con el nombre que elijas:
        </Lead>
        {QUE_SE_PUBLICA}
        <PerfilForm
          inicial={{ nombreVisible: null, pais: null, visibilidad: 'publica' }}
          alias={null}
          textoBoton="Sumarme"
          pedirAcuerdos
          onSubmit={registrar}
        />
      </Root>
    );
  }

  const { perfil } = club;

  return (
    <Root>
      <SectionTitle>Perfil del club</SectionTitle>
      <Lead>
        Los demás te ven como <strong>{perfil.nombre}</strong>.
        {perfil.visibilidad === 'publica' && (
          <>
            {' '}
            <Link href={`/hero/${perfil.id}`}>Ver tu ficha pública</Link>.
          </>
        )}
      </Lead>

      {!acuerdosAlDia(perfil) && (
        <Aviso role="status">
          Los acuerdos del club cambiaron. Hasta que aceptes la versión nueva, tus números no se
          actualizan. <Link href="/acuerdos" target="_blank" rel="noopener">Leer los acuerdos</Link>
          <BotonSecundario type="button" disabled={ocupado} onClick={() => correr(aceptarAcuerdos)}>
            Acepto los acuerdos nuevos
          </BotonSecundario>
        </Aviso>
      )}

      <Estado role="status">
        {publicacion === 'publicando' && 'Publicando tus números…'}
        {publicacion === 'publicada' && 'Tus números están al día.'}
        {publicacion === 'fallo' && 'No se pudieron publicar tus números. Se reintenta en la próxima carga.'}
        {publicacion === 'inactiva' &&
          (perfil.publicadaAt
            ? `Última publicación: ${new Date(perfil.publicadaAt).toLocaleDateString('es-AR')}.`
            : 'Todavía no se publicaron tus números.')}
      </Estado>

      <PerfilForm
        key={`${perfil.nombreVisible}-${perfil.pais}-${perfil.visibilidad}`}
        inicial={perfil}
        alias={perfil.alias}
        textoBoton="Guardar cambios"
        pedirAcuerdos={false}
        onSubmit={actualizar}
      />

      <Separador />

      <Lead>
        Dejar el club borra tu perfil y todo lo publicado. Tus estadísticas en este dispositivo no se
        tocan.
      </Lead>
      <BotonPeligro type="button" onClick={() => setConfirmandoBaja(true)}>
        Dejar el club
      </BotonPeligro>
      {errorAccion && <MensajeError role="alert">{errorAccion}</MensajeError>}

      <Modal
        open={confirmandoBaja}
        onClose={() => setConfirmandoBaja(false)}
        title="¿Dejar el club?"
        description="Se borran tu perfil, tu nombre, tu ficha y tus números publicados. No se puede deshacer."
        disableClose={ocupado}
        size="sm"
        footer={
          <Acciones>
            <BotonSecundario type="button" disabled={ocupado} onClick={() => setConfirmandoBaja(false)}>
              Cancelar
            </BotonSecundario>
            <BotonPeligro
              type="button"
              disabled={ocupado}
              onClick={() => correr(darseDeBaja).then(ok => ok && setConfirmandoBaja(false))}
            >
              {ocupado ? 'Borrando…' : 'Borrar todo'}
            </BotonPeligro>
          </Acciones>
        }
      >
        {errorAccion && <MensajeError role="alert">{errorAccion}</MensajeError>}
      </Modal>
    </Root>
  );
};

export default PerfilClub;
