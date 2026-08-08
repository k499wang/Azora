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
