import { StyleSheet, View } from 'react-native';
import type { CharacterId } from './BlobCharacter';

type ShapeKind = 'dot' | 'ring' | 'diamond' | 'dash';

interface DecorShape {
  kind: ShapeKind;
  size: number;
  opacity: number;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  rotate?: number;
}

// Shapes cluster on the right half, around and behind the character, so the
// copy column stays on a clean fill. Each character gets its own scatter.
const LAYOUTS: Record<CharacterId, DecorShape[]> = {
  calm: [
    { kind: 'ring', size: 22, opacity: 0.18, top: 14, right: 22 },
    { kind: 'dot', size: 8, opacity: 0.22, bottom: 26, right: 96 },
    { kind: 'dot', size: 5, opacity: 0.16, top: 40, right: 116 },
    { kind: 'diamond', size: 10, opacity: 0.14, bottom: 16, right: 18 },
    { kind: 'dot', size: 6, opacity: 0.12, top: 12, left: 10 },
  ],
  sleep: [
    { kind: 'dot', size: 6, opacity: 0.25, top: 16, right: 30 },
    { kind: 'dot', size: 4, opacity: 0.18, top: 34, right: 18 },
    { kind: 'diamond', size: 9, opacity: 0.16, bottom: 22, right: 100 },
    { kind: 'ring', size: 16, opacity: 0.14, bottom: 14, right: 24 },
    { kind: 'dot', size: 5, opacity: 0.12, bottom: 14, left: 12 },
  ],
  focus: [
    { kind: 'ring', size: 20, opacity: 0.16, top: 18, right: 96 },
    { kind: 'ring', size: 12, opacity: 0.18, bottom: 20, right: 26 },
    { kind: 'dot', size: 6, opacity: 0.2, top: 26, right: 24 },
    { kind: 'dash', size: 16, opacity: 0.14, bottom: 34, right: 108 },
    { kind: 'dot', size: 5, opacity: 0.12, top: 14, left: 10 },
  ],
  energy: [
    { kind: 'diamond', size: 12, opacity: 0.2, top: 16, right: 28 },
    { kind: 'dot', size: 7, opacity: 0.18, top: 40, right: 110 },
    { kind: 'dot', size: 5, opacity: 0.22, bottom: 30, right: 20 },
    { kind: 'dash', size: 14, opacity: 0.15, bottom: 18, right: 96, rotate: -20 },
    { kind: 'dot', size: 6, opacity: 0.12, top: 12, left: 12 },
  ],
  balance: [
    { kind: 'dot', size: 8, opacity: 0.18, top: 18, right: 100 },
    { kind: 'ring', size: 18, opacity: 0.16, bottom: 16, right: 20 },
    { kind: 'dot', size: 5, opacity: 0.2, top: 30, right: 22 },
    { kind: 'diamond', size: 9, opacity: 0.14, bottom: 34, right: 112 },
    { kind: 'dot', size: 6, opacity: 0.12, bottom: 14, left: 12 },
  ],
  hold: [
    { kind: 'dash', size: 12, opacity: 0.2, top: 20, right: 26, rotate: 90 },
    { kind: 'dot', size: 6, opacity: 0.18, top: 18, right: 104 },
    { kind: 'ring', size: 14, opacity: 0.15, bottom: 18, right: 96 },
    { kind: 'dot', size: 5, opacity: 0.22, bottom: 26, right: 20 },
    { kind: 'dot', size: 6, opacity: 0.12, top: 14, left: 10 },
  ],
};

const DASH_THICKNESS = 3;

interface TaskCardDecorProps {
  character: CharacterId;
  color: string;
}

function shapeStyle(shape: DecorShape, color: string) {
  switch (shape.kind) {
    case 'dot':
      return {
        width: shape.size,
        height: shape.size,
        borderRadius: shape.size / 2,
        backgroundColor: color,
      };
    case 'ring':
      return {
        width: shape.size,
        height: shape.size,
        borderRadius: shape.size / 2,
        borderWidth: 2,
        borderColor: color,
      };
    case 'diamond':
      return {
        width: shape.size,
        height: shape.size,
        borderRadius: shape.size / 4,
        backgroundColor: color,
      };
    case 'dash':
      return {
        width: shape.size,
        height: DASH_THICKNESS,
        borderRadius: DASH_THICKNESS / 2,
        backgroundColor: color,
      };
  }
}

export default function TaskCardDecor({ character, color }: TaskCardDecorProps) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {LAYOUTS[character].map((shape, index) => {
        const rotate = shape.rotate ?? (shape.kind === 'diamond' ? 45 : 0);

        return (
          <View
            key={index}
            style={[
              styles.shape,
              shapeStyle(shape, color),
              {
                opacity: shape.opacity,
                top: shape.top,
                bottom: shape.bottom,
                left: shape.left,
                right: shape.right,
                transform: [{ rotate: `${rotate}deg` }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  shape: {
    position: 'absolute',
  },
});
