import {
  useImperativeHandle,
  forwardRef,
  useRef,
  ReactNode,
  useEffect,
} from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

const OUTER_MAX_SIZE = 300;
const INNER_SIZE = 108;
const OUTER_MIN_SIZE = INNER_SIZE;
const OUTER_MIN_SCALE = OUTER_MIN_SIZE / OUTER_MAX_SIZE;

type AnimationCompletionCallback = () => void;

export interface BreathingCircleRef {
  expand: (duration: number, onComplete?: AnimationCompletionCallback) => void;
  contract: (duration: number, onComplete?: AnimationCompletionCallback) => void;
  pause: () => void;
  resumeExpand: (
    remainingSecs: number,
    onComplete?: AnimationCompletionCallback,
  ) => void;
  resumeContract: (
    remainingSecs: number,
    onComplete?: AnimationCompletionCallback,
  ) => void;
  reset: () => void;
}

interface BreathingThemeColors {
  outline: string;
  outlineOpacity?: number;
  outer: string;
  outerOpacity?: number;
  inner: string;
  beatFlush: string;
}

interface BreathingCircleProps {
  children?: ReactNode;
  cameraSlot?: ReactNode;
  beatTick?: number;
  themeColors?: BreathingThemeColors;
}

const BreathingCircle = forwardRef<BreathingCircleRef, BreathingCircleProps>(
  ({ children, cameraSlot, beatTick = 0, themeColors }, ref) => {
    const scale = useRef(new Animated.Value(OUTER_MIN_SCALE)).current;
    const innerFlush = useRef(new Animated.Value(0)).current;

    const animateTo = (
      toValue: number,
      duration: number,
      onComplete?: AnimationCompletionCallback,
    ) => {
      Animated.timing(scale, {
        toValue,
        duration: duration * 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          onComplete?.();
        }
      });
    };

    useEffect(() => {
      if (beatTick <= 0) return;

      innerFlush.setValue(0);
      Animated.sequence([
        Animated.timing(innerFlush, {
          toValue: 0.22,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(innerFlush, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    }, [beatTick, innerFlush]);

    useImperativeHandle(ref, () => ({
      expand(duration: number, onComplete?: AnimationCompletionCallback) {
        animateTo(1, duration, onComplete);
      },
      contract(duration: number, onComplete?: AnimationCompletionCallback) {
        animateTo(OUTER_MIN_SCALE, duration, onComplete);
      },
      pause() {
        scale.stopAnimation();
      },
      resumeExpand(
        remainingSecs: number,
        onComplete?: AnimationCompletionCallback,
      ) {
        animateTo(1, remainingSecs, onComplete);
      },
      resumeContract(
        remainingSecs: number,
        onComplete?: AnimationCompletionCallback,
      ) {
        animateTo(OUTER_MIN_SCALE, remainingSecs, onComplete);
      },
      reset() {
        scale.stopAnimation();
        scale.setValue(OUTER_MIN_SCALE);
      },
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
            { transform: [{ scale }] },
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
              { opacity: innerFlush },
            ]}
            pointerEvents="none"
          />
          {children ? (
            <View style={styles.innerContent}>{children}</View>
          ) : null}
        </View>
      </View>
    );
  },
);

BreathingCircle.displayName = 'BreathingCircle';

export default BreathingCircle;

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
