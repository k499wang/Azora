import { Ellipse } from 'react-native-svg';

const GRASS = '#8FD6BB';
const GRASS_DARK = '#6FBFAA';
const GRASS_TUFT = '#B4E8D2';
const SHADOW = 'rgba(11,107,92,0.12)';

export interface GrassGroundProps {
  /** Horizontal center of the dome. */
  cx: number;
  /** Vertical center of the dome (the stem's ground line). */
  baseY: number;
  moundRx: number;
  moundRy: number;
}

/**
 * The shared grassy mound every flower species grows from. Species compose it
 * at the bottom of their own Svg so all illustrations share one ground style.
 */
export default function GrassGround({
  cx,
  baseY,
  moundRx,
  moundRy,
}: GrassGroundProps) {
  return (
    <>
      <Ellipse
        cx={cx}
        cy={baseY}
        rx={moundRx * 0.92}
        ry={5}
        fill={SHADOW}
      />
      <Ellipse
        cx={cx}
        cy={baseY}
        rx={moundRx}
        ry={moundRy}
        fill={GRASS_DARK}
      />
      <Ellipse
        cx={cx}
        cy={baseY - 2}
        rx={moundRx - 3}
        ry={Math.max(2, moundRy - 3)}
        fill={GRASS}
      />
      <Ellipse
        cx={cx - moundRx * 0.42}
        cy={baseY - moundRy * 0.45}
        rx={moundRx * 0.18}
        ry={moundRy * 0.3}
        fill={GRASS_TUFT}
      />
      <Ellipse
        cx={cx + moundRx * 0.3}
        cy={baseY - moundRy * 0.3}
        rx={moundRx * 0.16}
        ry={moundRy * 0.26}
        fill={GRASS_TUFT}
      />
      <Ellipse
        cx={cx + moundRx * 0.55}
        cy={baseY - moundRy * 0.62}
        rx={moundRx * 0.13}
        ry={moundRy * 0.22}
        fill={GRASS_TUFT}
      />
    </>
  );
}
