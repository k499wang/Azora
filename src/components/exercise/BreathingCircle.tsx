import {
  useImperativeHandle,
  forwardRef,
  useRef,
  ReactNode,
  useEffect,
} from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';

const OUTER_MAX_SIZE = 300;
const INNER_SIZE = 108;
const OUTER_MIN_SIZE = INNER_SIZE;
const OUTER_MIN_SCALE = OUTER_MIN_SIZE / OUTER_MAX_SIZE;

export interface BreathingCircleRef {
  expand: (duration: number) => void;
  contract: (duration: number) => void;
  pause: () => void;
  resumeExpand: (remainingSecs: number) => void;
  resumeContract: (remainingSecs: number) => void;
  reset: () => void;
}

interface BreathingThemeColors {
  outline: string;
  outlineOpacity?: number;
  outer: string;
  outerOpacity?: number;
  inner: string;
  beatPulse: string;
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
    const beatScale = useRef(new Animated.Value(1)).current;
    const beatOpacity = useRef(new Animated.Value(0)).current;
    const rippleScale = useRef(new Animated.Value(1)).current;
    const rippleOpacity = useRef(new Animated.Value(0)).current;
    const innerFlush = useRef(new Animated.Value(0)).current;

    const animateTo = (toValue: number, duration: number) => {
      Animated.timing(scale, {
        toValue,
        duration: duration * 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
    };

    useEffect(() => {
      if (beatTick <= 0) return;

      beatScale.setValue(0.92);
      beatOpacity.setValue(0.55);
      Animated.sequence([
        Animated.timing(beatScale, {
          toValue: 1.18,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(beatScale, {
            toValue: 1.45,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(beatOpacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      rippleScale.setValue(0.95);
      rippleOpacity.setValue(0);
      Animated.sequence([
        Animated.delay(80),
        Animated.parallel([
          Animated.timing(rippleScale, {
            toValue: 1.65,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(rippleOpacity, {
              toValue: 0.3,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(rippleOpacity, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();

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
    }, [beatTick, beatScale, beatOpacity, rippleScale, rippleOpacity, innerFlush]);

    useImperativeHandle(ref, () => ({
      expand(duration: number) {
        animateTo(1, duration);
      },
      contract(duration: number) {
        animateTo(OUTER_MIN_SCALE, duration);
      },
      pause() {
        scale.stopAnimation();
      },
      resumeExpand(remainingSecs: number) {
        animateTo(1, remainingSecs);
      },
      resumeContract(remainingSecs: number) {
        animateTo(OUTER_MIN_SCALE, remainingSecs);
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
        <Animated.View
          style={[
            styles.beatRipple,
            themeColors && { backgroundColor: themeColors.beatPulse },
            { transform: [{ scale: rippleScale }], opacity: rippleOpacity },
          ]}
          pointerEvents="none"
        />
        <Animated.View
          style={[
            styles.beatHalo,
            themeColors && { backgroundColor: themeColors.beatPulse },
            { transform: [{ scale: beatScale }], opacity: beatOpacity },
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
  beatHalo: {
    position: 'absolute',
    width: INNER_SIZE,
    height: INNER_SIZE,
    borderRadius: INNER_SIZE / 2,
    backgroundColor: colors.error[100],
  },
  beatRipple: {
    position: 'absolute',
    width: INNER_SIZE,
    height: INNER_SIZE,
    borderRadius: INNER_SIZE / 2,
    backgroundColor: colors.error[100],
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
    gap: 4,
    paddingHorizontal: 16,
  },
});
