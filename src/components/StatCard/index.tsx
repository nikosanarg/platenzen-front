import React from 'react';
import StravaCornerBadge from '@/components/StravaCornerBadge';
import { Card, LeftVisual, Info, TopRow, Title, PrimaryValue, SubRow, SecondaryValue, ExtraLine } from './styled';

export interface StatCardProps {
  /** Slot opcional a la izquierda: soporta badges de distancia ('15K'), ranking ('#1'), ícono o null */
  leftVisual?: React.ReactNode;

  /** Título principal de la tarjeta */
  title: React.ReactNode;

  /**
   * Arreglo con hasta 2 líneas de subtítulos/metadatos
   * Ej: ["5:20/km · 28 ago 2026"] o ["26.20 km · 6:04/km", "🏅 Distancia más larga"]
   */
  subtitles?: React.ReactNode[];

  /** Valor/métrica principal ubicado a la derecha (flotante) */
  primaryValue?: React.ReactNode;

  /** Subvalor/etiqueta debajo del valor principal (ej. "▼ 5'19"") */
  secondaryValue?: React.ReactNode;

  /** Muestra la cinta/indicador con el logo de Strava en la esquina superior derecha */
  hasStravaBadge?: boolean;

  /** Variante estética de la card ('default' para fondo oscuro estándar, 'featured' para destacado con borde/gradiente dorado) */
  variant?: 'default' | 'featured';

  /** Handler de click opcional */
  onClick?: () => void;

  className?: string;

  /**
   * No está en la spec original: sin esto, las cards que enlazan a Strava
   * (récords, sesiones legendarias) perderían el comportamiento de link real
   * —abrir en pestaña nueva, click derecho, preview del navegador— y pasarían
   * a ser botones que simulan una navegación. `href` presente = `<a>`; si no,
   * `<button type="button">`.
   */
  href?: string;
  target?: string;
  rel?: string;
}

/**
 * La card de fila que comparten récords, sesiones legendarias y lugares
 * frecuentados: mismo layout ([leftVisual] título + subtítulos ... valor
 * principal + secundario), antes reimplementado a mano tres veces. Cada
 * sección sigue decidiendo SU contenido (qué va en cada slot, de qué color
 * es un nodo puntual como el label naranja de récords) — esto sólo unifica
 * el armazón.
 */
const StatCard: React.FC<StatCardProps> = ({
  leftVisual,
  title,
  subtitles,
  primaryValue,
  secondaryValue,
  hasStravaBadge = false,
  variant = 'default',
  onClick,
  className,
  href,
  target,
  rel,
}) => {
  const featured = variant === 'featured';
  const [firstSubtitle, ...restSubtitles] = subtitles ?? [];

  const interactionProps = href
    ? { as: 'a' as const, href, target, rel }
    : { as: 'button' as const, type: 'button' as const, onClick };

  return (
    <Card
      className={className}
      $featured={featured}
      $withStravaBadge={hasStravaBadge}
      {...interactionProps}
    >
      {hasStravaBadge && <StravaCornerBadge />}

      {leftVisual && <LeftVisual>{leftVisual}</LeftVisual>}

      <Info>
        <TopRow>
          <Title $featured={featured}>{title}</Title>
          {primaryValue !== undefined && <PrimaryValue>{primaryValue}</PrimaryValue>}
        </TopRow>

        {(firstSubtitle !== undefined || secondaryValue !== undefined) && (
          <SubRow>
            <span>{firstSubtitle}</span>
            {secondaryValue !== undefined && <SecondaryValue>{secondaryValue}</SecondaryValue>}
          </SubRow>
        )}

        {restSubtitles.map((line, i) => (
          <ExtraLine key={i}>{line}</ExtraLine>
        ))}
      </Info>
    </Card>
  );
};

export default StatCard;
