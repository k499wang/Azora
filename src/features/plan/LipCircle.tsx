import { useRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { CHUNKY_LIP_DEPTH } from '../../components/common/ChunkyButton';
import { radius } from '../../theme/card';
import type { PathNodeAnchor } from './PathDayCard';

export interface LipTone {
  face: string;
  lip: string;
  icon: string;
}

export type MeasureNode = () => Promise<PathNodeAnchor | null>;

interface Props {
  size: number;
  tone: LipTone;
  onPress: (measure: MeasureNode) => void;
  accessibilityLabel?: string;
  children?: ReactNode;
}

/** ChunkyButton's face-on-a-lip as a circle that can say where it is when pressed. */
export default function LipCircle({
  size,
  tone,
  onPress,
  accessibilityLabel,
  children,
}: Props) {
  const ref = useRef<View>(null);

  const measure: MeasureNode = () =>
    new Promise((resolve) => {
      if (ref.current == null) {
        resolve(null);
        return;
      }
      ref.current.measureInWindow((x, y, width, height) =>
        resolve({ x, y, width, height }),
      );
    });

  const handlePress = () => onPress(measure);

  return (
    <Pressable
      accessibilityRole={accessibilityLabel == null ? undefined : 'button'}
      accessibilityLabel={accessibilityLabel}
      onPress={handlePress}
    >
      {({ pressed }) => (
        <View ref={ref} style={[styles.lip, { width: size, backgroundColor: tone.lip }]}>
          <View
            style={[
              styles.face,
              { width: size, height: size, backgroundColor: tone.face },
              pressed && styles.facePressed,
            ]}
          >
            {children}
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  lip: {
    borderRadius: radius.full,
    paddingBottom: CHUNKY_LIP_DEPTH,
  },
  face: {
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  facePressed: {
    transform: [{ translateY: CHUNKY_LIP_DEPTH }],
  },
});
