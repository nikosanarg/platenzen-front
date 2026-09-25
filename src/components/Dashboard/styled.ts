import Link from 'next/link';
import styled from 'styled-components';

/**
 * Sin fondo propio: deja ver el fondo de la app (`AppBackground`, montado en
 * el layout raíz) detrás del header y del contenido. `DashboardContent` es el
 * que pone su oscurecido extra encima.
 */
export const DashboardRoot = styled.div`
  min-height: 100vh;
`;

/**
 * Grid de tres columnas para que la navegación quede centrada de verdad en la
 * topbar, no sólo "a la izquierda con espacio a la derecha": `1fr auto 1fr`
 * le da a la columna del medio su ancho justo y reparte el resto por igual a
 * los costados, así el centro de la nav coincide con el centro del header
 * sin importar cuánto pesen el logo o los botones de acción.
 *
 * En el teléfono no hay ancho para las tres columnas en una fila: la nav baja
 * a su propia fila completa, todavía dentro del header.
 */
export const DashboardHeader = styled.header`
  background: var(--bg-secondary);
  padding: 1rem 1.5rem;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  grid-template-areas: "left nav right";
  align-items: center;
  gap: 0.75rem;
  position: sticky;
  top: 0;
  z-index: 10;

  @media (max-width: 640px) {
    grid-template-columns: 1fr auto;
    grid-template-areas:
      "left  right"
      "nav   nav";
    padding: 0.75rem 1rem;
  }
`;

export const HeaderLeft = styled.div`
  grid-area: left;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
`;

export const HeaderLogo = styled.div`
  width: 32px;
  height: 32px;
  border-radius: var(--radius);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const HeaderTitle = styled.h1`
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
`;

export const HeaderRight = styled.div`
  grid-area: right;
  display: flex;
  align-items: center;
  justify-self: end;
  gap: 0.75rem;
`;

/**
 * Las tabs de la Home viven en la topbar: no hay una segunda franja sticky.
 * Columna propia en el grid del header —ver `DashboardHeader`— así queda
 * centrada de verdad, no pegada al logo.
 */
export const HeaderNav = styled.nav`
  grid-area: nav;
  display: flex;
  align-items: center;
  gap: 0.2rem;

  @media (max-width: 640px) {
    width: 100%;
    justify-content: center;
    border-top: 1px solid var(--border);
    padding-top: 0.6rem;
  }
`;

export const HeaderNavLink = styled(Link)<{ $active: boolean }>`
  padding: 0.4rem 0.7rem;
  border-radius: var(--radius);
  font-size: 0.82rem;
  font-weight: ${({ $active }) => ($active ? '700' : '500')};
  color: ${({ $active }) => ($active ? 'var(--accent-hover)' : 'var(--text-muted)')};
  background: ${({ $active }) => ($active ? 'var(--bg-card)' : 'transparent')};
  text-decoration: none;
  white-space: nowrap;
  transition: color 0.15s, background 0.15s;

  &:hover {
    color: ${({ $active }) => ($active ? 'var(--accent-hover)' : 'var(--text-primary)')};
  }

  @media (max-width: 640px) {
    flex: 1;
    text-align: center;
  }
`;

export const CacheInfo = styled.span`
  font-size: 0.75rem;
  color: var(--text-muted);

  @media (max-width: 600px) {
    display: none;
  }
`;

/**
 * El centro, donde vive el contenido propio de Platenzen: un fondo negro
 * extra encima del fondo de la app, para que el texto se lea sobre la foto en
 * vez de competir con ella. Las cards de adentro (`Panel`, `bg-card`, …) son
 * opacas aparte — esto es el fondo de la columna que las contiene, no una
 * propiedad de cada una.
 */
export const DashboardContent = styled.main`
  position: relative;
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.75rem 1.5rem 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 2.25rem;

  /*
   * El negro no es una caja: es un degradado que se desvanece hacia los
   * bordes de la PANTALLA, no de esta columna. left: 50% + translateX es el
   * truco para que el pseudo-elemento mida 100vw sin importar que el
   * contenido esté acotado a 1400px — si el fondo fuera del ancho de la
   * columna, en una pantalla ancha se vería el corte recto de la captura.
   *
   * Sólo tiene sentido en desktop: en el teléfono el contenido ya ocupa todo
   * el ancho de la pantalla, así que el degradado hacia los "laterales" no
   * tiene dónde desvanecerse y sólo se ve como una franja oscura pegada a
   * los bordes.
   */
  @media (min-width: 601px) {
    &::before {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      left: 50%;
      width: 100vw;
      transform: translateX(-50%);
      background: linear-gradient(
        to right,
        transparent 0%,
        rgba(6, 7, 10, 0.39) 5%,
        rgba(6, 7, 10, 0.39) 95%,
        transparent 100%
      );
      z-index: -1;
      pointer-events: none;
    }
  }

  @media (max-width: 600px) {
    padding: 1.25rem 1rem 2rem;
    gap: 1.85rem;
  }
`;

export const LegendaryGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

export const SectionTitle = styled.h2`
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-primary);
  margin-bottom: 1rem;
`;

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

/**
 * Siempre 2 columnas: `PatternsGrid` sólo se monta dentro de `DesktopOnly`
 * (>900px), el mismo corte en el que `MobileOnly` pasa a mostrar las
 * pestañas. Un breakpoint propio más angosto acá dejaba una zona intermedia
 * —escritorio, pero con las dos tarjetas apiladas igual— que no es ninguna
 * de las dos vistas pensadas para ese ancho.
 */
export const PatternsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  align-items: stretch;
`;

export const FullWidthChart = styled.div`
  grid-column: 1 / -1;
`;

export const LoadingOverlay = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 1rem;
  background: rgba(6, 7, 10, 0.78);
`;

export const LoadingText = styled.p`
  color: var(--text-secondary);
  font-size: 1rem;
`;

export const LoadingCount = styled.span`
  color: var(--text-muted);
  font-size: 0.875rem;
`;

export const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

/* ── Historia: contenido principal + sidebar de listas ────────────── */

/**
 * `900px` es el mismo corte que ya usa el resto del producto para pasar de
 * escritorio a teléfono (`TopRow`, `VisualPanel`, `useIsMobile`): abajo de eso
 * no hay ancho para una columna angosta al costado, así que la sidebar baja
 * al final del contenido principal, en el orden en que aparece en el DOM.
 */
export const HistoriaLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 1.5rem;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

export const HistoriaMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2.25rem;
  min-width: 0;
`;

export const HistoriaSidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  min-width: 0;

  @media (min-width: 901px) {
    position: sticky;
    top: 5.5rem;
  }
`;
