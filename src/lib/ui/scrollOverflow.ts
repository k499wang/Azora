// Sub-pixel layout rounding makes content and viewport differ by fractions on
// screens that visually fit exactly, so overflow needs a tolerance.
const OVERFLOW_TOLERANCE = 1;

export function hasScrollOverflow(
  contentHeight: number,
  viewportHeight: number,
): boolean {
  if (viewportHeight <= 0 || contentHeight <= 0) return false;
  return contentHeight - viewportHeight > OVERFLOW_TOLERANCE;
}

interface CenteredBodyBoxInput {
  centerBody: boolean;
  bodyHeight: number;
  viewportHeight: number;
  centerPadding: number;
}

/**
 * An absolutely positioned centred body contributes nothing to the scroll
 * view's content size, so a body taller than the viewport is clipped with no
 * way to scroll to the rest. Returns the height the content box must be forced
 * to so the body fits inside it — and, as a side effect, so the scroll view
 * measures real overflow and re-enables scrolling. Null means leave it alone.
 */
export function centeredBodyMinHeight({
  centerBody,
  bodyHeight,
  viewportHeight,
  centerPadding,
}: CenteredBodyBoxInput): number | null {
  if (!centerBody) return null;
  if (viewportHeight <= 0 || bodyHeight <= 0) return null;
  const box = bodyHeight + Math.max(centerPadding, 0);
  return box > viewportHeight ? box : null;
}
