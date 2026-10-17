import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../../theme/colors';

interface Props {
  size: number;
}

const LOBES = 13;
const WOBBLE = [0, 0.6, -0.4, 0.9, 0.1, -0.7, 0.5, -0.2, 0.8, -0.5, 0.3, -0.8, 0.4];

function sealEdgePath(): string {
  const points = Array.from({ length: LOBES * 2 }, (_, i) => {
    const angle = (i / (LOBES * 2)) * Math.PI * 2;
    const r = (i % 2 === 0 ? 48 : 45.5) + WOBBLE[Math.floor(i / 2)];
    return [50 + r * Math.cos(angle), 50 + r * Math.sin(angle)] as const;
  });
  const mid = (a: readonly [number, number], b: readonly [number, number]) =>
    `${((a[0] + b[0]) / 2).toFixed(1)} ${((a[1] + b[1]) / 2).toFixed(1)}`;
  const start = `M${mid(points[points.length - 1], points[0])}`;
  const curves = points.map(
    (point, i) =>
      `Q${point[0].toFixed(1)} ${point[1].toFixed(1)} ${mid(point, points[(i + 1) % points.length])}`,
  );
  return [start, ...curves, 'Z'].join(' ');
}

const SEAL_EDGE = sealEdgePath();
const HEART =
  'M50 66 C38 57 32 50 32 43 C32 37 37 33 42 33 C46 33 48.5 35.5 50 38 C51.5 35.5 54 33 58 33 C63 33 68 37 68 43 C68 50 62 57 50 66 Z';

export default function WaxSeal({ size }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d={SEAL_EDGE} fill={colors.playful.coral.base} />
      <Circle
        cx={50}
        cy={50}
        r={34}
        fill="none"
        stroke={colors.playful.coral.ink}
        strokeOpacity={0.25}
        strokeWidth={2.5}
      />
      <Path d={HEART} fill={colors.playful.coral.tint} />
    </Svg>
  );
}
