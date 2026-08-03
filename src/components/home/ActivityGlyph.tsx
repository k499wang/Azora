import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { GlyphShape } from '../../features/exercise/guidedBreathing/categoryPalette';

const VIEWBOX = 100;
const PETAL_ANGLES = [0, 45, 90, 135];
const BAR_LAYOUT = [
  { x: 10, height: 34 },
  { x: 32, height: 62 },
  { x: 54, height: 44 },
  { x: 76, height: 74 },
];

interface ActivityGlyphProps {
  shape: GlyphShape;
  size: number;
  color: string;
  opacity?: number;
}

function quarterArc(radius: number): string {
  return `M ${12 + radius},88 A ${radius},${radius} 0 0 0 12,${88 - radius}`;
}

function ShapeBody({ shape, color }: { shape: GlyphShape; color: string }) {
  switch (shape) {
    case 'rings':
      return (
        <G stroke={color} strokeWidth={8} fill="none">
          <Circle cx={50} cy={50} r={45} />
          <Circle cx={50} cy={50} r={29} />
          <Circle cx={50} cy={50} r={13} fill={color} />
        </G>
      );
    case 'orb':
      return (
        <G fill={color}>
          <Circle cx={42} cy={56} r={36} />
          <Circle cx={80} cy={20} r={11} />
        </G>
      );
    case 'arcs':
      return (
        <G stroke={color} strokeWidth={9} fill="none" strokeLinecap="round">
          <Path d={quarterArc(26)} />
          <Path d={quarterArc(50)} />
          <Path d={quarterArc(74)} />
        </G>
      );
    case 'waves':
      return (
        <G stroke={color} strokeWidth={9} fill="none" strokeLinecap="round">
          <Path d="M 4,36 q 12,-18 24,0 t 24,0 t 24,0 t 24,0" />
          <Path d="M 4,68 q 12,-18 24,0 t 24,0 t 24,0 t 24,0" />
        </G>
      );
    case 'petals':
      return (
        <G fill={color}>
          {PETAL_ANGLES.map((angle) => (
            <Ellipse
              key={angle}
              cx={50}
              cy={50}
              rx={13}
              ry={38}
              transform={`rotate(${angle} 50 50)`}
            />
          ))}
        </G>
      );
    case 'bars':
      return (
        <G fill={color}>
          {BAR_LAYOUT.map((bar) => (
            <Rect
              key={bar.x}
              x={bar.x}
              y={90 - bar.height}
              width={14}
              height={bar.height}
              rx={7}
            />
          ))}
        </G>
      );
  }
}

export default function ActivityGlyph({
  shape,
  size,
  color,
  opacity = 1,
}: ActivityGlyphProps) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} opacity={opacity}>
      <ShapeBody shape={shape} color={color} />
    </Svg>
  );
}
