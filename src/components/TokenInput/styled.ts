import styled from 'styled-components';
import { Panel } from '@/components/Panel';

export const TokenContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  padding: 2rem;
`;

export const TokenCard = styled(Panel)`
  padding: 3rem;
  width: 100%;
  max-width: 440px;
  box-shadow: var(--shadow);
`;

export const LogoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
`;

export const LogoText = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
`;

export const TokenTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
`;

export const TokenSubtitle = styled.p`
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 1.75rem;
  line-height: 1.5;
`;

export const OAuthButton = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  width: 100%;
  background: var(--accent);
  color: var(--text-on-accent);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  font-weight: 600;
  padding: 0.875rem 1.5rem;
  cursor: pointer;
  text-decoration: none;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 0 0 4px rgba(var(--accent-rgb), 0.35);
  }
`;

/** La columna de proveedores. Hoy son dos; el día que sean tres no hay que tocar nada. */
export const ProviderStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
`;

/**
 * Un proveedor que todavía no se puede conectar.
 *
 * Es un `<button>` con `aria-disabled`, no con el `disabled` nativo: un botón
 * realmente deshabilitado no recibe foco ni puntero, así que quien navega con
 * teclado o lector de pantalla nunca llegaría al texto que explica por qué está
 * apagado — que es lo único que hay para comunicar acá. El guard del click vive
 * en el componente.
 */
export const OAuthButtonOff = styled(OAuthButton)`
  background: var(--bg-input);
  color: var(--text-muted);
  border: 1px solid var(--border-light);
  cursor: not-allowed;

  &:hover {
    box-shadow: none;
  }
`;

/** Marca denominativa como texto: no hay asset de Garmin en el repo. Ver el comentario del componente. */
export const ProviderWordmark = styled.span`
  font-weight: 700;
  letter-spacing: 0.08em;
`;

export const ProviderNote = styled.p`
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: var(--text-muted);
  line-height: 1.45;
`;

/** Separa la instalación de la conexión: son dos decisiones distintas, no dos pasos de la misma. */
export const InstallRow = styled.div`
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border-light);
`;

export const TokenError = styled.p`
  margin-top: 0.75rem;
  font-size: 0.85rem;
  color: var(--error);
  text-align: center;
`;

export const RevokeHint = styled.p`
  margin-top: 0.6rem;
  font-size: 0.75rem;
  color: var(--text-muted);
  text-align: center;
  line-height: 1.4;

  a {
    color: var(--text-muted);
    text-decoration: underline;
  }
`;
