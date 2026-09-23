const TOOLTIP_MARGIN = 6;
const TOOLTIP_OFFSET_X = 12;
const TOOLTIP_OFFSET_Y = 18;
const TOOLTIP_POSITION_THRESHOLD = 1;

export interface TooltipCoords {
  x: number;
  y: number;
}

/**
 * Posiciona el tooltip relativo al mouse, pegado a un contenedor: usado por
 * cualquier grilla de celdas hover-able (el heatmap anual y el de día×hora).
 * Se clampea al viewport del contenedor para que nunca se corte en los bordes.
 */
export function calculateTooltipPosition(
  containerRect: DOMRect | undefined,
  clientX: number,
  clientY: number,
  tooltipWidth: number,
  tooltipHeight: number
): TooltipCoords {
  const x = clientX - (containerRect?.left ?? 0);
  const y = clientY - (containerRect?.top ?? 0);
  const maxX = Math.max(TOOLTIP_MARGIN, (containerRect?.width ?? 0) - tooltipWidth - TOOLTIP_MARGIN);
  const maxY = Math.max(TOOLTIP_MARGIN, (containerRect?.height ?? 0) - tooltipHeight - TOOLTIP_MARGIN);
  return {
    x: Math.min(Math.max(x + TOOLTIP_OFFSET_X, TOOLTIP_MARGIN), maxX),
    y: Math.min(Math.max(y - TOOLTIP_OFFSET_Y, TOOLTIP_MARGIN), maxY),
  };
}

/** Sólo actualiza el eje que se movió lo suficiente: evita el jitter de un tooltip que persigue el pixel exacto del mouse. */
export function updateTooltipPosition<T extends TooltipCoords | null>(
  current: T,
  coords: TooltipCoords
): T {
  if (!current) return current;
  const shouldUpdateX = Math.abs(current.x - coords.x) > TOOLTIP_POSITION_THRESHOLD;
  const shouldUpdateY = Math.abs(current.y - coords.y) > TOOLTIP_POSITION_THRESHOLD;
  if (!shouldUpdateX && !shouldUpdateY) return current;
  return {
    ...current,
    x: shouldUpdateX ? coords.x : current.x,
    y: shouldUpdateY ? coords.y : current.y,
  };
}
