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
 * One closed outline, built as an ellipse of the given half-width and half-
 * thickness that is then bent into an arc.
 *
 * Bending rather than tapering is what keeps a closed lid soft: the two edges
 * stay the same distance apart the whole way across, so the shape ends in a
 * round cap of its own thickness instead of the cusp two curves meeting at a
 * point would give. `roundness` is how much of that bend is straightened out —
 * at 1 the arc is a plain ellipse spanning `top` to `bottom`, which is the wide
 * open eye; at 0 it is the full arc, hanging as far below the tips as `top` and
 * `bottom` place it.
 *
 * The bend is a vertical shear, so control points carry both its value and its
 * slope at the end they belong to. Without the slope term the tangents no
 * longer meet at the joins and the arc creases at the apex and the tips.
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
  const radiusY = (bottom - top) / 2;
  const midOffset = (top + bottom) / 2;
  const baseY = cy + midOffset * roundness;
  const bend = midOffset * (1 - roundness);

  const shear = (x: number) => {
    const t = (x - cx) / width;
    return bend * (1 - t * t);
  };
  const shearSlope = (x: number) => (-2 * bend * (x - cx)) / (width * width);
  /** An on-curve point, carried by the bend itself. */
  const at = (x: number, y: number) => `${x} ${y + shear(x)}`;
  /** A control point, carried by the bend at the end it belongs to. */
  const off = (endX: number, x: number, y: number) =>
    `${x} ${y + shear(endX) + shearSlope(endX) * (x - endX)}`;

  const left = cx - width;
  const right = cx + width;
  const reachX = ELLIPSE_KAPPA * width;
  const reachY = ELLIPSE_KAPPA * radiusY;
  const topY = baseY - radiusY;
  const bottomY = baseY + radiusY;

  return (
    `M ${at(left, baseY)} ` +
    `C ${off(left, left, baseY - reachY)} ${off(cx, cx - reachX, topY)} ${at(cx, topY)} ` +
    `C ${off(cx, cx + reachX, topY)} ${off(right, right, baseY - reachY)} ${at(right, baseY)} ` +
    `C ${off(right, right, baseY + reachY)} ${off(cx, cx + reachX, bottomY)} ${at(cx, bottomY)} ` +
    `C ${off(cx, cx - reachX, bottomY)} ${off(left, left, baseY + reachY)} ${at(left, baseY)} Z`
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
