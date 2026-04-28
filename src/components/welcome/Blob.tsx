import Svg, { Path, Circle, Ellipse } from 'react-native-svg';
import { colors } from '../../theme/colors';

interface Props {
  size: number;
  phase: 'inhale' | 'exhale';
}

export function Blob({ size, phase }: Props) {
  const bodyColor = colors.primary.blue500;
  const faceColor = colors.neutral[0];
  const cheekColor = colors.primary.blue700;

  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Path
        d="M100 12 C146 12 184 50 184 96 C184 138 158 168 128 182 C112 190 88 190 72 182 C42 168 16 138 16 96 C16 50 54 12 100 12 Z"
        fill={bodyColor}
      />

      <Path
        d="M60 98 Q72 90 84 98"
        stroke={faceColor}
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M116 98 Q128 90 140 98"
        stroke={faceColor}
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
      />

      {phase === 'inhale' ? (
        <Circle cx={100} cy={130} r={6} fill={faceColor} />
      ) : (
        <Ellipse cx={100} cy={130} rx={11} ry={7} fill={faceColor} />
      )}

      <Circle cx={56} cy={118} r={6} fill={cheekColor} opacity={0.35} />
      <Circle cx={144} cy={118} r={6} fill={cheekColor} opacity={0.35} />
    </Svg>
  );
}
