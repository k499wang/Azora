import { ReactNode, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { colors } from '../../../../theme/colors';
import { spacing } from '../../../../theme/spacing';
import { BREATH_EXHALED } from '../breathEnvelope';

const OUTER_MAX_SIZE = 300;
const INNER_SIZE = 108;
const OUTER_MIN_SIZE = INNER_SIZE;
const OUTER_MIN_SCALE = OUTER_MIN_SIZE / OUTER_MAX_SIZE;

interface BreathingThemeColors {
  outline: string;
  outlineOpacity?: number;
  outer: string;
  outerOpacity?: number;
  inner: string;
  beatFlush: string;
}

interface BreathingCircleProps {
  envelope: SharedValue<number>;
  children?: ReactNode;
  cameraSlot?: ReactNode;
  beatTick?: number;
  themeColors?: BreathingThemeColors;
}

export default function BreathingCircle({
  envelope,
  children,
  cameraSlot,
  beatTick = 0,
  themeColors,
}: BreathingCircleProps) {
  const innerFlush = useSharedValue(0);

  useEffect(() => {
    if (beatTick <= 0) return;

    innerFlush.value = 0;
    innerFlush.value = withSequence(
      withTiming(0.22, { duration: 80 }),
      withTiming(0, { duration: 280 }),
    );
  }, [beatTick, innerFlush]);

  const outerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale:
          OUTER_MIN_SCALE +
          (envelope.value - BREATH_EXHALED) * (1 - OUTER_MIN_SCALE),
      },
    ],
  }));

  const innerFlushStyle = useAnimatedStyle(() => ({
    opacity: innerFlush.value,
  }));

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.outline,
          themeColors && {
            borderColor: themeColors.outline,
            opacity: themeColors.outlineOpacity ?? 0.5,
          },
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.outer,
          outerStyle,
          themeColors && {
            backgroundColor: themeColors.outer,
            opacity: themeColors.outerOpacity ?? 0.28,
          },
        ]}
        pointerEvents="none"
      />
      <View
        style={[styles.inner, themeColors && { backgroundColor: themeColors.inner }]}
        pointerEvents="none"
      >
        {cameraSlot ? (
          <View style={StyleSheet.absoluteFillObject}>{cameraSlot}</View>
        ) : null}
        <Animated.View
          style={[
            styles.innerFlush,
            themeColors && { backgroundColor: themeColors.beatFlush },
            innerFlushStyle,
          ]}
          pointerEvents="none"
        />
        {children ? <View style={styles.innerContent}>{children}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: OUTER_MAX_SIZE,
    height: OUTER_MAX_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: {
    position: 'absolute',
    width: OUTER_MAX_SIZE,
    height: OUTER_MAX_SIZE,
    borderRadius: OUTER_MAX_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.primary.blue400,
    opacity: 0.5,
  },
  outer: {
    position: 'absolute',
    width: OUTER_MAX_SIZE,
    height: OUTER_MAX_SIZE,
    borderRadius: OUTER_MAX_SIZE / 2,
    backgroundColor: colors.primary.blue400,
    opacity: 0.28,
  },
  innerFlush: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.error[500],
  },
  inner: {
    width: INNER_SIZE,
    height: INNER_SIZE,
    borderRadius: INNER_SIZE / 2,
    backgroundColor: colors.primary.blue500,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
});
