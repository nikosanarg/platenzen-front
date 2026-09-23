import React from 'react';
import StravaCornerBadge from '@/components/StravaCornerBadge';
import { Card, LeftVisual, Info, Title, SubtitleLine, RightVisual, PrimaryValue, SecondaryValue } from './styled';

export interface StatCardProps {
  /** Slot opcional a la izquierda: soporta badges de distancia ('15K'), ranking ('#1'), ícono o null */
  leftVisual?: React.ReactNode;

  /** Título principal de la tarjeta */
  title: React.ReactNode;

  /**
   * Arreglo con hasta 2 líneas de subtítulos/metadatos, cada una su propia
   * fila debajo del título — no comparten fila con `primaryValue`/`secondaryValue`.
   * Ej: ["5:20/km", "28 ago 2026"] o ["26.20 km · 6:04/km", "🏅 Distancia más larga"]
   */
  subtitles?: React.ReactNode[];

  /** Valor/métrica principal: columna sola a la derecha, simétrica a `leftVisual` */
  primaryValue?: React.ReactNode;

  /** Subvalor apilado debajo de `primaryValue` en esa misma columna (ej. "▼ 5'19"", o la fecha si no hay `primaryValue`) */
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
 * frecuentados: tres columnas ([leftVisual] | título+subtítulos | valor
 * principal+secundario), antes reimplementado a mano tres veces. Las
 * columnas de los extremos son independientes entre sí — el valor de la
 * derecha no se empareja fila a fila con un subtítulo puntual, se apila
 * solo, igual que `leftVisual`. Cada sección sigue decidiendo SU contenido
 * (qué va en cada slot, de qué color es un nodo puntual como el label
 * naranja de récords) — esto sólo unifica el armazón.
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
  const hasRightVisual = primaryValue !== undefined || secondaryValue !== undefined;

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
        <Title $featured={featured}>{title}</Title>
        {(subtitles ?? []).map((line, i) => (
          <SubtitleLine key={i}>{line}</SubtitleLine>
        ))}
      </Info>

      {hasRightVisual && (
        <RightVisual>
          {primaryValue !== undefined && <PrimaryValue>{primaryValue}</PrimaryValue>}
          {secondaryValue !== undefined && <SecondaryValue>{secondaryValue}</SecondaryValue>}
        </RightVisual>
      )}
    </Card>
  );
};

export default StatCard;
