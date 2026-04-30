import { useImperativeHandle, forwardRef, useRef, ReactNode } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';

const OUTER_MAX_SIZE = 300;
const OUTER_MIN_SIZE = 170;
const INNER_SIZE = 160;
const OUTER_MIN_SCALE = OUTER_MIN_SIZE / OUTER_MAX_SIZE;

export interface BreathingCircleRef {
  expand: (duration: number) => void;
  contract: (duration: number) => void;
  pause: () => void;
  resumeExpand: (remainingSecs: number) => void;
  resumeContract: (remainingSecs: number) => void;
  reset: () => void;
}

interface BreathingCircleProps {
  children?: ReactNode;
}

const BreathingCircle = forwardRef<BreathingCircleRef, BreathingCircleProps>(
  ({ children }, ref) => {
    const scale = useRef(new Animated.Value(OUTER_MIN_SCALE)).current;

    const animateTo = (toValue: number, duration: number) => {
      Animated.timing(scale, {
        toValue,
        duration: duration * 1000,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }).start();
    };

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
        <View style={styles.outline} pointerEvents="none" />
        <Animated.View
          style={[styles.outer, { transform: [{ scale }] }]}
          pointerEvents="none"
        />
        <View style={styles.inner} pointerEvents="none">
          {children}
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
  inner: {
    width: INNER_SIZE,
    height: INNER_SIZE,
    borderRadius: INNER_SIZE / 2,
    backgroundColor: colors.primary.blue500,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 16,
  },
});
