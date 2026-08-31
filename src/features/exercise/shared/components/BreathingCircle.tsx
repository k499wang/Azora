import {
  useImperativeHandle,
  forwardRef,
  useRef,
  ReactNode,
  useEffect,
} from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { colors } from '../../../../theme/colors';
import { spacing } from '../../../../theme/spacing';

// `screen`, not `window`: the circle's size feeds a StyleSheet and an Animated
// initial value, both of which are fixed at module load, so this has to read a
// number that cannot change afterwards. The device screen qualifies; `window`
// does not, because an iPad in Split View resizes it and the circle would stay
// frozen at whatever width the app happened to launch at. On a phone the two
// are the same, so this changes nothing there.
const SCREEN_WIDTH = Dimensions.get('screen').width;
const OUTER_MAX_SIZE = Math.min(328, SCREEN_WIDTH - spacing.lg * 2);
// Wide enough for a one-word cue at reading size once the content padding is
// taken off it.
const INNER_SIZE = 116;
const OUTLINE_WIDTH = 2;
const OUTER_MIN_SCALE = INNER_SIZE / OUTER_MAX_SIZE;

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
          style={[
            styles.outline,
            themeColors && {
              borderColor: themeColors.outline,
              opacity: themeColors.outlineOpacity ?? 0.5,
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
          {children ? <View style={styles.innerContent}>{children}</View> : null}
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
    borderWidth: OUTLINE_WIDTH,
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
