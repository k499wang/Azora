/**
 * The two shapes every Azo face is built from.
 *
 * A face here is a set of numbers, not a drawing: an eye and a mouth are each a
 * closed outline with an upper and a lower edge, so changing expression
 * interpolates geometry rather than cross-fading two pictures. The eye actually
 * closes; the mouth actually opens.
 *
 * These live with the mascot rather than with the breathing session that first
 * needed them, because the character is one character wherever he appears and
 * his eye is one eye. `breathFaces` re-exports them so the session keeps its own
 * vocabulary; every value passed in is in the caller's own coordinate space.
 */

const ELLIPSE_KAPPA = 0.5522848;

/**
 * Four cubics with matching topology at both ends of the morph. At roundness 0,
 * each half is the exact cubic conversion of half of `lensPath`'s quadratic.
 * At roundness 1, the controls are the standard kappa ellipse approximation.
 */
export function eyePath(
  cx: number,
  cy: number,
  width: number,
  top: number,
  bottom: number,
  roundness: number,
): string {
  'worklet';
  const mix = (from: number, to: number) => from + (to - from) * roundness;
  const centerY = cy + (top + bottom) / 2;
  const radiusY = (bottom - top) / 2;
  const left = cx - width;
  const right = cx + width;
  const topY = cy + top;
  const bottomY = cy + bottom;
  const sideY = mix(cy, centerY);

  const topLeftControl1X = mix(cx - (2 * width) / 3, left);
  const topLeftControl1Y = mix(
    cy + (2 * top) / 3,
    centerY - ELLIPSE_KAPPA * radiusY,
  );
  const topLeftControl2X = mix(cx - width / 3, cx - ELLIPSE_KAPPA * width);

  const topRightControl1X = mix(cx + width / 3, cx + ELLIPSE_KAPPA * width);
  const topRightControl2X = mix(cx + (2 * width) / 3, right);
  const topRightControl2Y = mix(
    cy + (2 * top) / 3,
    centerY - ELLIPSE_KAPPA * radiusY,
  );

  const bottomRightControl1X = mix(cx + (2 * width) / 3, right);
  const bottomRightControl1Y = mix(
    cy + (2 * bottom) / 3,
    centerY + ELLIPSE_KAPPA * radiusY,
  );
  const bottomRightControl2X = mix(cx + width / 3, cx + ELLIPSE_KAPPA * width);

  const bottomLeftControl1X = mix(cx - width / 3, cx - ELLIPSE_KAPPA * width);
  const bottomLeftControl2X = mix(cx - (2 * width) / 3, left);
  const bottomLeftControl2Y = mix(
    cy + (2 * bottom) / 3,
    centerY + ELLIPSE_KAPPA * radiusY,
  );

  return (
    `M ${left} ${sideY} ` +
    `C ${topLeftControl1X} ${topLeftControl1Y} ${topLeftControl2X} ${topY} ${cx} ${topY} ` +
    `C ${topRightControl1X} ${topY} ${topRightControl2X} ${topRightControl2Y} ${right} ${sideY} ` +
    `C ${bottomRightControl1X} ${bottomRightControl1Y} ${bottomRightControl2X} ${bottomY} ${cx} ${bottomY} ` +
    `C ${bottomLeftControl1X} ${bottomY} ${bottomLeftControl2X} ${bottomLeftControl2Y} ${left} ${sideY} Z`
  );
}

/**
 * Two quadratics meeting at the corners. The control points are doubled because
 * a quadratic reaches half its control offset at the midpoint, so `top` and
 * `bottom` read directly as the shape's vertical extents.
 */
export function lensPath(
  cx: number,
  cy: number,
  width: number,
  top: number,
  bottom: number,
): string {
  'worklet';
  const left = cx - width;
  const right = cx + width;
  return `M ${left} ${cy} Q ${cx} ${cy + top * 2} ${right} ${cy} Q ${cx} ${cy + bottom * 2} ${left} ${cy} Z`;
}
