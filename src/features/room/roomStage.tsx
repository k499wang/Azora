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
 * The box a single decoration actually occupies, in room space.
 *
 * Objects are authored where they sit in the room — a rug low and central, wall
 * art high and left — so drawing one on its own with the room's viewBox leaves
 * it stranded in a corner at a fraction of the size. Measuring its own bounds
 * is what lets it be shown alone and centred.
 */
export function decorationViewBox(
  day: DayKey,
  option: string,
  pad = 12,
): string | null {
  const polys = DECOR[`${day}.${option}`];
  if (polys == null || polys.length === 0) {
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

  return `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${
    maxY - minY + pad * 2
  }`;
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
  const polys = DECOR[`${day}.${option}`] ?? [];

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
