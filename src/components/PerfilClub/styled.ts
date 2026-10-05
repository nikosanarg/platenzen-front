import styled from 'styled-components';
import { Panel } from '@/components/Panel';
import { OAuthButton } from '@/components/TokenInput/styled';

export const Root = styled(Panel)`
  padding: 1.75rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  @media (max-width: 600px) {
    padding: 1.25rem 1rem;
  }
`;

export const Lead = styled.p`
  margin-top: -0.5rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.55;

  a {
    color: var(--accent);
  }
`;

export const Lista = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding-left: 1.1rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  max-width: 560px;
`;

export const Campo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

export const Etiqueta = styled.label`
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
`;

export const Ayuda = styled.p`
  font-size: 0.78rem;
  color: var(--text-muted);
  line-height: 1.45;
`;

const control = `
  width: 100%;
  padding: 0.6rem 0.75rem;
  border-radius: var(--radius);
  border: 1px solid var(--border-light);
  background: var(--bg-input);
  color: var(--text-primary);
  font: inherit;
  font-size: 0.9rem;

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
`;

export const Input = styled.input`
  ${control}
`;

/** El usuario se lee como la dirección que va a ser: el dominio fijo, a la izquierda. */
export const ConPrefijo = styled.div`
  display: flex;
  align-items: stretch;

  input {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
`;

export const Prefijo = styled.span`
  display: flex;
  align-items: center;
  padding: 0 0.6rem;
  border: 1px solid var(--border-light);
  border-right: 0;
  border-radius: var(--radius) 0 0 var(--radius);
  background: var(--bg-secondary);
  color: var(--text-muted);
  font-size: 0.85rem;
  white-space: nowrap;

  @media (max-width: 420px) {
    display: none;
  }
`;

export const Select = styled.select`
  ${control}
`;

export const Opciones = styled.fieldset`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border: 0;
  padding: 0;
  margin: 0;
`;

export const Leyenda = styled.legend`
  margin-bottom: 0.35rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
`;

export const Opcion = styled.label<{ $activa: boolean }>`
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  padding: 0.65rem 0.75rem;
  border-radius: var(--radius);
  border: 1px solid ${({ $activa }) => ($activa ? 'rgba(var(--accent-rgb), 0.6)' : 'var(--border)')};
  background: ${({ $activa }) => ($activa ? 'var(--accent-muted)' : 'transparent')};
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.45;

  input {
    margin-top: 0.2rem;
    accent-color: var(--accent);
  }

  strong {
    color: var(--text-primary);
  }
`;

export const Check = styled.label`
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.45;
  cursor: pointer;

  input {
    margin-top: 0.2rem;
    accent-color: var(--accent);
  }

  a {
    color: var(--accent);
  }
`;

export const Boton = styled(OAuthButton)`
  width: auto;
  align-self: flex-start;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

export const BotonSecundario = styled.button`
  align-self: flex-start;
  background: none;
  border: 1px solid var(--border-light);
  border-radius: var(--radius);
  color: var(--text-secondary);
  font: inherit;
  font-size: 0.85rem;
  padding: 0.55rem 1rem;
  cursor: pointer;

  &:hover {
    color: var(--text-primary);
    border-color: var(--text-muted);
  }
`;

export const BotonPeligro = styled(BotonSecundario)`
  color: var(--error);
  border-color: rgba(var(--error-rgb), 0.5);

  &:hover {
    color: var(--error);
    border-color: var(--error);
  }
`;

export const MensajeError = styled.p`
  font-size: 0.85rem;
  color: var(--error);
`;

export const Aviso = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.8rem 1rem;
  border-radius: var(--radius);
  background: rgba(var(--warning-rgb), 0.1);
  border: 1px solid rgba(var(--warning-rgb), 0.4);
  font-size: 0.85rem;
  color: var(--text-secondary);
`;

export const Estado = styled.p`
  font-size: 0.8rem;
  color: var(--text-muted);

  a {
    color: var(--accent);
  }
`;

export const Separador = styled.hr`
  border: 0;
  border-top: 1px solid var(--border);
  margin: 0.5rem 0;
`;

export const Acciones = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;
