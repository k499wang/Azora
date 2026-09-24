import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../common/Text';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const PAD_HEIGHT = 140;
const STROKE_WIDTH = 3;

interface SignaturePadProps {
  label: string;
  onSignedChange: (signed: boolean) => void;
}

function point(x: number, y: number) {
  return `${x.toFixed(1)} ${y.toFixed(1)}`;
}

export default function SignaturePad({ label, onSignedChange }: SignaturePadProps) {
  const [strokes, setStrokes] = useState<string[]>([]);
  const [liveStroke, setLiveStroke] = useState('');
  const liveRef = useRef('');
  const onSignedChangeRef = useRef(onSignedChange);
  onSignedChangeRef.current = onSignedChange;

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .minDistance(0)
        .onBegin((event) => {
          liveRef.current = `M${point(event.x, event.y)}`;
          setLiveStroke(liveRef.current);
        })
        .onUpdate((event) => {
          liveRef.current += ` L${point(event.x, event.y)}`;
          setLiveStroke(liveRef.current);
        })
        .onFinalize(() => {
          const stroke = liveRef.current;
          liveRef.current = '';
          setLiveStroke('');
          // A tap leaves a move with no line, which draws nothing.
          if (!stroke.includes('L')) return;
          setStrokes((current) => [...current, stroke]);
          onSignedChangeRef.current(true);
        }),
    [],
  );

  const clear = () => {
    setStrokes([]);
    onSignedChange(false);
  };

  return (
    <View style={styles.pad}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {strokes.length > 0 ? (
          <Pressable accessibilityRole="button" onPress={clear} hitSlop={spacing.sm}>
            <Text style={styles.clear}>Clear</Text>
          </Pressable>
        ) : null}
      </View>
      <GestureDetector gesture={pan}>
        <View style={styles.canvas} accessibilityLabel="Signature area">
          <Svg width="100%" height={PAD_HEIGHT}>
            {[...strokes, liveStroke].map((d, index) =>
              d ? (
                <Path
                  key={index}
                  d={d}
                  stroke={colors.text.primary}
                  strokeWidth={STROKE_WIDTH}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              ) : null,
            )}
          </Svg>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: {
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
  clear: {
    ...typography.body.small,
    color: colors.primary.blue700,
  },
  canvas: {
    height: PAD_HEIGHT,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral[300],
  },
});
