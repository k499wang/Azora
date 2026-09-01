import { memo } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors } from '../../theme/colors';

/**
 * Mochi's mouth, drawn rather than assembled.
 *
 * Everything else about him is a rounded View, which is what keeps him cheap to
 * animate — but his mouth is one continuous line that changes direction twice,
 * and two Views butted together at a turn leave the outside of the corner
 * unfilled however carefully they are placed. So it is a stroked path, the shape
 * a pen would make: a short stem dropping between the eyes into two soft lobes.
 *
 * Measured in body units like the rest of him and scaled by `u`, so one mouth
 * serves the walking blob, the portrait and the sign-in crop alike.
 */
export type MochiMouthKind = 'smile' | 'frown' | 'open' | 'line';

/** the pen, in body units */
const STROKE = 1.9;

interface Props {
  kind: MochiMouthKind;
  /** the mouth's box, in body units */
  w: number;
  h: number;
  /** body units to pixels */
  u: number;
  /** dims the mood-specific mouths against the ink of the eyes */
  opacity?: number;
}

function MochiMouth({ kind, w, h, u, opacity = 1 }: Props) {
  const pad = STROKE / 2;
  const cx = w / 2;
  const span = h - pad * 2;
  /** where the lobes meet under the stem, and where their outer tips land */
  const peak = pad + span * 0.55;
  const tip = pad + span * 0.3;

  const path =
    kind === 'smile'
      ? `M ${cx},${pad} L ${cx},${peak}` +
        ` M ${pad},${tip} Q ${cx / 2},${h - pad} ${cx},${peak}` +
        ` Q ${cx * 1.5},${h - pad} ${w - pad},${tip}`
      : kind === 'frown'
        ? `M ${pad},${h - pad} Q ${cx},${pad} ${w - pad},${h - pad}`
        : `M ${pad},${h / 2} L ${w - pad},${h / 2}`;

  return (
    <Svg
      width={w * u}
      height={h * u}
      viewBox={`0 0 ${w} ${h}`}
      opacity={opacity}
    >
      {kind === 'open' ? (
        <Rect
          x={0}
          y={0}
          width={w}
          height={h}
          rx={Math.min(w, h) / 2}
          fill={colors.roomBlob.ink}
        />
      ) : (
        <Path
          d={path}
          fill="none"
          stroke={colors.roomBlob.ink}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </Svg>
  );
}

export default memo(MochiMouth);
