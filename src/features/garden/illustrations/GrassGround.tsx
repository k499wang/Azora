import { Ellipse } from 'react-native-svg';

const GRASS = '#86C875';
const GRASS_DARK = '#5EAA69';
const SHADOW = 'rgba(48,112,76,0.16)';

export interface GrassGroundProps {
  /** Horizontal center of the soft garden mound. */
  cx: number;
  /** Vertical center of the mound top. */
  baseY: number;
  moundRx: number;
  moundRy: number;
}

/** A quiet, soft mound that the stem can grow into. */
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
        cy={baseY + 7}
        rx={moundRx * 0.86}
        ry={moundRy * 0.58}
        fill={SHADOW}
      />
      <Ellipse
        cx={cx}
        cy={baseY + 1}
        rx={moundRx}
        ry={moundRy}
        fill={GRASS_DARK}
      />
      <Ellipse
        cx={cx}
        cy={baseY - 2}
        rx={moundRx - 2}
        ry={Math.max(3, moundRy - 3)}
        fill={GRASS}
      />
    </>
  );
}

/**
 * A shallow foreground edge that hides only the stem's last few pixels. It
 * makes the plant feel rooted without covering the leaves or lower silhouette.
 */
export function GrassGroundRootLip({
  cx,
  baseY,
  moundRx,
}: Pick<GrassGroundProps, 'cx' | 'baseY' | 'moundRx'>) {
  return (
    <Ellipse
      cx={cx}
      cy={baseY + 1}
      rx={moundRx * 0.3}
      ry={4}
      fill={GRASS}
    />
  );
}
