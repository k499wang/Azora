import Svg, { Polygon } from 'react-native-svg';
import {
  DECOR,
  ROOM_ASPECT,
  VIEW_BOX,
  type DayKey,
  type FrameHue,
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
  const polys = DECOR[`${day}.${option}`] ?? [];
  return polys.filter((poly) => poly.sh !== 1);
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
}

/** one decoration, alone, at room scale — nothing else drawn */
export default function DecorationLayer({
  width,
  day,
  option,
}: DecorationLayerProps) {
  const polys = DECOR[`${day}.${option}`] ?? [];

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
