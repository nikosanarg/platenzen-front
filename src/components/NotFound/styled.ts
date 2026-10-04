import styled from 'styled-components';
import { OAuthButton } from '@/components/TokenInput/styled';

export const Root = styled.main`
  position: relative;
  min-height: 100dvh;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
`;

/**
 * La foto ocupa toda la pantalla y el texto va abajo a la izquierda: el cartel
 * está a la derecha de la imagen y es lo que cuenta el chiste, no se tapa.
 */
export const Photo = styled.div`
  position: absolute;
  inset: 0;

  img {
    object-fit: cover;
    object-position: 70% center;
  }

  /* Oscurece el pie para que el texto se lea sobre el sendero claro. */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(13, 13, 15, 0.92) 0%, rgba(13, 13, 15, 0.55) 35%, transparent 65%);
  }
`;

export const Content = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  max-width: 520px;
  padding: 2.5rem;

  @media (max-width: 600px) {
    padding: 1.5rem 1rem 2rem;
  }
`;

export const Code = styled.p`
  font-family: var(--font-num);
  font-size: 3.5rem;
  line-height: 1;
  color: var(--accent);
`;

export const Title = styled.h1`
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text-primary);
`;

export const Text = styled.p`
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
`;

export const HomeLink = styled(OAuthButton)`
  width: auto;
`;
