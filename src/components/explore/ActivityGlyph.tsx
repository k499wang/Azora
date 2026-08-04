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
const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
const BLOOM_ANGLES = [0, 60, 120, 180, 240, 300];
const LATTICE_COORDS = [12, 31, 50, 69, 88];
const STEP_LAYOUT = [
  { x: 6, y: 22 },
  { x: 30, y: 46 },
  { x: 54, y: 70 },
];

type ActivityGlyphProps = {
  shape: GlyphShape;
  size: number;
  color: string;
  opacity?: number;
};

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
    case 'stack':
      return (
        <G stroke={color} strokeWidth={8} fill="none">
          <Rect x={8} y={8} width={84} height={84} rx={22} />
          <Rect x={28} y={28} width={44} height={44} rx={14} />
        </G>
      );
    case 'prism':
      return (
        <G stroke={color} strokeWidth={8} fill="none" strokeLinejoin="round">
          <Path d="M50 8 L92 84 L8 84 Z" />
          <Path d="M50 40 L72 80 L28 80 Z" />
        </G>
      );
    case 'lattice':
      return (
        <G fill={color}>
          {LATTICE_COORDS.map((y) =>
            LATTICE_COORDS.map((x) => (
              <Circle key={`${x}-${y}`} cx={x} cy={y} r={6} />
            )),
          )}
        </G>
      );
    case 'crescent':
      return (
        <Path
          fill={color}
          d="M28 5 A45 45 0 1 1 28 95 A22 45 0 1 0 28 5 Z"
        />
      );
    case 'steps':
      return (
        <G fill={color}>
          {STEP_LAYOUT.map((step) => (
            <Rect
              key={step.x}
              x={step.x}
              y={step.y}
              width={40}
              height={12}
              rx={6}
            />
          ))}
        </G>
      );
    case 'beam':
      return (
        <G fill={color}>
          {RAY_ANGLES.map((angle) => (
            <Rect
              key={angle}
              x={45}
              y={2}
              width={10}
              height={30}
              rx={5}
              transform={`rotate(${angle} 50 50)`}
            />
          ))}
          <Circle cx={50} cy={50} r={14} />
        </G>
      );
    case 'chevrons':
      return (
        <G
          stroke={color}
          strokeWidth={9}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path d="M14 46 L50 14 L86 46" />
          <Path d="M14 86 L50 54 L86 86" />
        </G>
      );
    case 'ripple':
      return (
        <G stroke={color} strokeWidth={9} fill="none" strokeLinecap="round">
          <Path d="M12 78 A38 38 0 0 1 88 78" />
          <Path d="M28 78 A22 22 0 0 1 72 78" />
          <Path d="M44 78 A6 6 0 0 1 56 78" />
        </G>
      );
    case 'bloom':
      return (
        <G fill={color}>
          <Circle cx={50} cy={50} r={17} />
          {BLOOM_ANGLES.map((angle) => (
            <Circle
              key={angle}
              cx={50}
              cy={18}
              r={14}
              transform={`rotate(${angle} 50 50)`}
            />
          ))}
        </G>
      );
    case 'droplet':
      return (
        <Path
          fill={color}
          d="M50 8 C68 32 84 46 84 62 A34 34 0 0 1 16 62 C16 46 32 32 50 8 Z"
        />
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
