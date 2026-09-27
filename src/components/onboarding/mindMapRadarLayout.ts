import { breakpoints } from '../../theme/breakpoints';

export interface Point {
  x: number;
  y: number;
}

export type ChipAlign = 'flex-start' | 'center' | 'flex-end';

/**
 * Where one axis's label chip sits. `left`/`top` place a fixed slot; `align`
 * pins the chip inside it to the edge that must stay put, so a chip narrower
 * than the slot still hugs its vertex.
 */
export interface ChipPlacement {
  left: number;
  top: number;
  align: ChipAlign;
}

export interface RadarLayout {
  radius: number;
  /** chips, gaps and strokes grow by this on a tablet */
  scale: number;
  chipWidth: number;
  chipHeight: number;
  center: Point;
  height: number;
  vertices: Point[];
  chips: ChipPlacement[];
}

/** Sized for the longest label, "Recovery", with its icon. */
const CHIP_WIDTH = 100;
const CHIP_HEIGHT = 30;
/** Between a chip and the vertex it names. */
const CHIP_GAP = 10;
/**
 * An upper chip reaches back over its vertex by this much, which is what lets
 * the pentagon grow toward the screen edge. It is lifted by `UPPER_LIFT` so the
 * part over the pentagon clears the edge climbing to the top vertex.
 */
const CHIP_TUCK = 48;
const UPPER_LIFT = 42;
/** A lower chip is pushed this far outward so it sits off the corner, not under it. */
const LOWER_SHIFT = 16;
/** Kept clear between a chip and the canvas edge. */
const EDGE_MARGIN = 8;
/** An axis this close to vertical centres its chip over or under the vertex. */
const VERTICAL_AXIS = 0.2;
const MAX_SCALE = 1.5;
const PHONE_WIDTH = 390;
/** The pentagon is drawn a little inside the largest size its chips allow, so it does not crowd the page. */
const FIT_SHARE = 0.92;
/** Stops a tablet's pentagon crowding the copy above and below it. */
const MAX_RADIUS_SHARE = 0.28;

export function axisAngle(index: number, total: number): number {
  return -Math.PI / 2 + (index * 2 * Math.PI) / total;
}

type Side = 'vertical' | 'upper' | 'lower';

function sideOf(angle: number): Side {
  if (Math.abs(Math.cos(angle)) < VERTICAL_AXIS) return 'vertical';
  return Math.sin(angle) < 0 ? 'upper' : 'lower';
}

/**
 * How big the radar is drawn on a canvas `size` wide, and where each label
 * chip goes. Pure, so every phone width is covered by tests rather than by
 * remembering to check a device.
 */
export function getRadarLayout(size: number, axisCount: number): RadarLayout {
  const scale =
    size >= breakpoints.regularWidth ? Math.min(size / PHONE_WIDTH, MAX_SCALE) : 1;
  const chipWidth = CHIP_WIDTH * scale;
  const chipHeight = CHIP_HEIGHT * scale;
  const gap = CHIP_GAP * scale;
  const tuck = CHIP_TUCK * scale;
  const lift = UPPER_LIFT * scale;
  const shift = LOWER_SHIFT * scale;
  const angles = Array.from({ length: axisCount }, (_, i) => axisAngle(i, axisCount));

  // Each chip's outer edge sits at |cos|·r + reach from the centre; the tightest
  // axis sets how big the pentagon can be before a chip runs off the canvas.
  const reachFor = (side: Side) =>
    side === 'upper' ? chipWidth - tuck : side === 'lower' ? shift + chipWidth / 2 : chipWidth / 2;
  const fitted = Math.min(
    ...angles.map((angle) => {
      const across = Math.abs(Math.cos(angle));
      const room = size / 2 - EDGE_MARGIN - reachFor(sideOf(angle));
      return across > 0.001 ? room / across : Infinity;
    }),
  );
  const comfortable = fitted * FIT_SHARE;
  const radius = Math.floor(
    scale > 1 ? Math.min(comfortable, size * MAX_RADIUS_SHARE) : comfortable,
  );

  // Laid out around (0, 0) first, then shifted so the top chip starts the box.
  const relative = angles.map((angle) => {
    const vertex = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
    const side = sideOf(angle);
    const outward = Math.sign(vertex.x);
    const top =
      side === 'upper'
        ? vertex.y - lift - chipHeight
        : vertex.y < 0
          ? vertex.y - gap - chipHeight
          : vertex.y + gap;
    let chip: ChipPlacement;
    if (side === 'upper') {
      chip =
        outward > 0
          ? { left: vertex.x - tuck, top, align: 'flex-start' }
          : { left: vertex.x + tuck - chipWidth, top, align: 'flex-end' };
    } else {
      const centreX = side === 'lower' ? vertex.x + outward * shift : vertex.x;
      chip = { left: centreX - chipWidth / 2, top, align: 'center' };
    }
    return { vertex, chip };
  });

  const boxTop = Math.min(...relative.map(({ chip }) => chip.top));
  const boxBottom = Math.max(...relative.map(({ chip }) => chip.top + chipHeight));
  const center = { x: size / 2, y: -boxTop };

  return {
    radius,
    scale,
    chipWidth,
    chipHeight,
    center,
    height: Math.ceil(boxBottom - boxTop),
    vertices: relative.map(({ vertex }) => ({
      x: center.x + vertex.x,
      y: center.y + vertex.y,
    })),
    chips: relative.map(({ chip }) => ({
      ...chip,
      left: center.x + chip.left,
      top: center.y + chip.top,
    })),
  };
}
