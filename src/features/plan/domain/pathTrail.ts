/**
 * The dotted road between a week's nodes, kept pure so its geometry and
 * colouring can be tested without drawing it.
 */

export interface TrailPoint {
  x: number;
  y: number;
}

/** A node's face centre and how far its coin reaches sideways, up and down. */
export interface TrailNode extends TrailPoint {
  reach: number;
  above: number;
  below: number;
}

export type TrailStretch = 'ahead' | 'walked' | 'gold';

/**
 * Each stretch leads into the node at its index: gold when both of its ends
 * are gold coins, walked once the node is reached, ahead otherwise.
 */
export function trailStretches(
  reached: readonly boolean[],
  gold: readonly boolean[],
): TrailStretch[] {
  return reached.map((isReached, index) =>
    index > 0 && gold[index - 1] && gold[index] ? 'gold' : isReached ? 'walked' : 'ahead',
  );
}

/**
 * Dots along the straight line between two coins, from just outside one rim
 * to just outside the other and spread evenly between, so every stretch
 * keeps one angle and nearly the same rhythm however far apart its coins sit.
 */
export function trailDots(
  from: TrailNode,
  to: TrailNode,
  pitch: number,
  clearance: number,
): TrailPoint[] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) return [];
  const ux = dx / length;
  const uy = dy / length;
  const down = uy >= 0;
  const start = rimDistance(ux, uy, from.reach, down ? from.below : from.above) + clearance;
  const end = length - rimDistance(ux, uy, to.reach, down ? to.above : to.below) - clearance;
  const span = end - start;
  if (span < 0) return [];
  const gaps = Math.round(span / pitch);
  if (gaps === 0) {
    const middle = (start + end) / 2;
    return [{ x: from.x + ux * middle, y: from.y + uy * middle }];
  }
  return Array.from({ length: gaps + 1 }, (_, index) => {
    const along = start + (span * index) / gaps;
    return { x: from.x + ux * along, y: from.y + uy * along };
  });
}

/** How far a ray from an ellipse's centre travels before it leaves the ellipse. */
function rimDistance(ux: number, uy: number, rx: number, ry: number): number {
  return 1 / Math.hypot(ux / rx, uy / ry);
}
