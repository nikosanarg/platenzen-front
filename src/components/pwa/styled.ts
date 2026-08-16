import styled from 'styled-components';

/**
 * Los tres avisos flotantes del ciclo de vida de la PWA (instalar, iOS,
 * actualización disponible) comparten posición y superficie. Se apilan si
 * más de uno estuviera visible a la vez (no debería pasar en la práctica:
 * `beforeinstallprompt` no dispara en iOS, y el banner de actualización sólo
 * aparece tras una instalación previa, momento en el que ya no tiene sentido
 * seguir ofreciendo instalar).
 */
const AvisoFlotante = styled.div`
  position: fixed;
  bottom: 20px;
  left: 16px;
  right: 16px;
  max-width: 400px;
  margin: 0 auto;
  padding: 14px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  color: var(--text-primary);
  font-size: 0.875rem;
  line-height: 1.4;
  z-index: 999;
`;

export const InstallButton = styled.button`
  position: fixed;
  bottom: 20px;
  right: 16px;
  padding: 12px 18px;
  background: var(--accent);
  color: var(--text-on-accent);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--shadow);
  z-index: 999;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 0 0 4px rgba(var(--accent-rgb), 0.35);
  }
`;

/**
 * El botón de instalación embebido en una pantalla, en vez de flotando en una
 * esquina. Es secundario a propósito: en la pantalla de conexión no puede
 * competir con "Conectar con Strava", que es a lo que la persona vino.
 */
export const InstallInlineButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1.25rem;
  background: transparent;
  color: var(--text-secondary);
  border: 1px dashed var(--border-light);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;

  &:hover {
    color: var(--text-primary);
    border-color: var(--text-muted);
  }
`;

export const IOSBanner = styled(AvisoFlotante)`
  strong {
    display: block;
    margin-bottom: 4px;
    color: var(--text-primary);
  }

  span {
    color: var(--text-secondary);
  }
`;

export const UpdateBanner = styled(AvisoFlotante)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const UpdateButton = styled.button`
  flex-shrink: 0;
  padding: 8px 14px;
  background: var(--accent);
  color: var(--text-on-accent);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: var(--accent-hover);
  }
`;
