import Svg, { Polygon } from 'react-native-svg';
import {
  DECOR,
  ROOM_ASPECT,
  VIEW_BOX,
  VIEW_BOX_HEIGHT,
  VIEW_BOX_WIDTH,
  type DayKey,
  type FrameHue,
  type Poly,
} from './RoomScene';
import { colors } from '../../theme/colors';

/**
 * Shared pieces for anything drawn *over* the room rather than inside it.
 *
 * Overlays share `VIEW_BOX` and a width with `HexRoom`, so they register on the
 * room exactly — which is what lets a decoration be animated freely without
 * touching the generated scene or re-rendering the room every frame.
 */

/** the floor's centre in viewBox space, as a fraction of the rendered box */
export const FLOOR_CENTER_Y = 0.732;

/** the room's frame hue as a playful palette entry, for glows and sparks */
export function frameAccent(hue: FrameHue): { base: string; soft: string } {
  return colors.playful[hue];
}

/**
 * A decoration without the shadow it casts.
 *
 * The shadow belongs to the room — the same patch for every option in a day,
 * under the floor-standing pieces, behind the ones hung on the wall. Alone in a
 * card it is both meaningless (a contact shadow under something floating) and
 * actively wrong: it is wider than most of the objects, so it, not the object,
 * decided the bounds. Everything was then fitted and centred on a box the
 * object filled only part of.
 */
function soloPolys(day: DayKey, option: string) {
  return decorationPolys(day, option, 'object');
}

/**
 * Which half of a decoration to draw.
 *
 * Every floor-standing and wall-hung piece is authored with its own contact
 * shadow — the right shape, on the right plane, in the right place for that
 * object in that slot. Rugs and garlands have none, correctly: one lies on the
 * floor and the other hangs clear of every surface.
 *
 * Splitting them matters when the object moves and the shadow must not. A
 * shadow that travels with the thing casting it is the one arrangement that
 * reads as sliding across the picture rather than descending onto a surface.
 */
export type DecorationPart = 'all' | 'object' | 'shadow';

export function decorationPolys(
  day: DayKey,
  option: string,
  part: DecorationPart,
): Poly[] {
  const polys = DECOR[`${day}.${option}`] ?? [];
  if (part === 'all') return polys;

  return polys.filter((poly) =>
    part === 'shadow' ? poly.sh === 1 : poly.sh !== 1,
  );
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** the tightest box around a set of polys, in room space */
export function polyBounds(polys: Poly[]): Bounds | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const poly of polys) {
    for (const pair of poly.p.trim().split(/\s+/)) {
      const [x, y] = pair.split(',').map(Number);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    return null;
  }

  return { minX, minY, maxX, maxY };
}

const [VIEW_BOX_MIN_X, VIEW_BOX_MIN_Y] = VIEW_BOX.split(' ').map(Number);

/**
 * The patch of room a slot owns, in room space.
 *
 * Every option for a day is authored in the same corner, so the union of their
 * bounds is the area the slot occupies however it ends up filled — which is
 * what anything standing in for the empty slot should be measured against,
 * rather than whichever option happens to be drawn as the stand-in.
 */
export function slotBounds(day: DayKey): Bounds | null {
  return polyBounds(
    Object.entries(DECOR)
      .filter(([key]) => key.startsWith(`${day}.`))
      .flatMap(([, dayPolys]) => dayPolys.filter((poly) => poly.sh !== 1)),
  );
}

/**
 * The centre of a slot's patch, as a fraction of the rendered box.
 *
 * Where the "+" standing in for the empty slot belongs. It moves with the
 * artwork instead of being a table of numbers that quietly goes stale the next
 * time a piece is redrawn.
 */
export function slotAnchor(day: DayKey): { x: number; y: number } | null {
  const box = slotBounds(day);
  if (box == null) {
    return null;
  }

  return {
    x: ((box.minX + box.maxX) / 2 - VIEW_BOX_MIN_X) / VIEW_BOX_WIDTH,
    y: ((box.minY + box.maxY) / 2 - VIEW_BOX_MIN_Y) / VIEW_BOX_HEIGHT,
  };
}

/**
 * A point of the room as a fraction of the rendered box.
 *
 * Anything that has to be placed on top of a room — a transform origin, the
 * centre of a burst — is authored in room space and drawn in screen pixels,
 * and this is the one conversion between them.
 */
export function roomPointToFraction(
  x: number,
  y: number,
): { x: number; y: number } {
  return {
    x: (x - VIEW_BOX_MIN_X) / VIEW_BOX_WIDTH,
    y: (y - VIEW_BOX_MIN_Y) / VIEW_BOX_HEIGHT,
  };
}

/**
 * A square box around a single decoration, in room space.
 *
 * Objects are authored where they sit in the room — a rug low and central, wall
 * art high and left — so drawing one on its own with the room's viewBox leaves
 * it stranded in a corner at a fraction of the size. Measuring its own bounds
 * is what lets it be shown alone and centred.
 *
 * Square, because the caller's box is square and the aspects here run from 0.76
 * to 1.62. A tight viewBox would leave the fitting to `preserveAspectRatio`,
 * which centres the letterboxed result — the tall pieces sat left of centre
 * because that is exactly what was being relied on. Padding the short axis out
 * here makes the object centred by construction: same shape in, same shape out,
 * nothing left to interpret.
 */
export function decorationViewBox(
  day: DayKey,
  option: string,
  pad = 12,
): string | null {
  const polys = soloPolys(day, option);
  if (polys.length === 0) {
    return null;
  }

  const box = polyBounds(polys);
  if (box == null) {
    return null;
  }

  const { minX, minY, maxX, maxY } = box;

  const width = maxX - minX + pad * 2;
  const height = maxY - minY + pad * 2;
  const size = Math.max(width, height);

  return `${minX - pad - (size - width) / 2} ${
    minY - pad - (size - height) / 2
  } ${size} ${size}`;
}

/** one decoration, cropped to itself and centred — no room around it */
export function DecorationSolo({
  width,
  height,
  day,
  option,
}: {
  width: number;
  height: number;
  day: DayKey;
  option: string;
}) {
  const viewBox = decorationViewBox(day, option);
  const polys = soloPolys(day, option);

  if (viewBox == null) {
    return null;
  }

  return (
    <Svg width={width} height={height} viewBox={viewBox}>
      {polys.map((poly, index) => (
        <Polygon
          key={index}
          points={poly.p}
          fill={poly.f ?? 'none'}
          opacity={poly.o ?? 1}
          stroke={poly.s ?? 'none'}
          strokeWidth={poly.w ?? 0}
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}

interface DecorationLayerProps {
  width: number;
  day: DayKey;
  option: string;
  /** defaults to the whole piece, shadow included */
  part?: DecorationPart;
}

/** one decoration, alone, at room scale — nothing else drawn */
export default function DecorationLayer({
  width,
  day,
  option,
  part = 'all',
}: DecorationLayerProps) {
  const polys = decorationPolys(day, option, part);

  return (
    <Svg width={width} height={width * ROOM_ASPECT} viewBox={VIEW_BOX}>
      {polys.map((poly, index) => (
        <Polygon
          key={index}
          points={poly.p}
          fill={poly.f ?? 'none'}
          opacity={poly.o ?? 1}
          stroke={poly.s ?? 'none'}
          strokeWidth={poly.w ?? 0}
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}
