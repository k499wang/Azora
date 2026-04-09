import { useImperativeHandle, forwardRef, useRef, ReactNode } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';

const INNER_SIZE = 220;
const LAYER_TWO_SIZE = 270;
const LAYER_THREE_SIZE = 320;
const OUTER_SIZE = 370;
const MIN_SCALE = 0.78;
const MAX_SCALE = 1.08;

export interface BreathingCircleRef {
  expand: (duration: number) => void;
  contract: (duration: number) => void;
  reset: () => void;
}

interface BreathingCircleProps {
  children?: ReactNode;
}

const BreathingCircle = forwardRef<BreathingCircleRef, BreathingCircleProps>(
  ({ children }, ref) => {
    const scale = useRef(new Animated.Value(MIN_SCALE)).current;
    const glowOpacity = useRef(new Animated.Value(0.15)).current;

    useImperativeHandle(ref, () => ({
      expand(duration: number) {
        Animated.parallel([
          Animated.timing(scale, {
            toValue: MAX_SCALE,
            duration: duration * 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.35,
            duration: duration * 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]).start();
      },
      contract(duration: number) {
        Animated.parallel([
          Animated.timing(scale, {
            toValue: MIN_SCALE,
            duration: duration * 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.1,
            duration: duration * 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]).start();
      },
      reset() {
        scale.stopAnimation();
        glowOpacity.stopAnimation();
        scale.setValue(MIN_SCALE);
        glowOpacity.setValue(0.15);
      },
    }));

    return (
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.outerLayer,
            { opacity: glowOpacity, transform: [{ scale }] },
          ]}
        />
        <Animated.View
          style={[
            styles.layerThree,
            { opacity: glowOpacity, transform: [{ scale }] },
          ]}
        />
        <Animated.View
          style={[
            styles.layerTwo,
            { opacity: glowOpacity, transform: [{ scale }] },
          ]}
        />
        <Animated.View style={[styles.innerCircle, { transform: [{ scale }] }]}>
          {children}
        </Animated.View>
      </View>
    );
  },
);

BreathingCircle.displayName = 'BreathingCircle';

export default BreathingCircle;

const styles = StyleSheet.create({
  container: {
    width: OUTER_SIZE,
    height: OUTER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerLayer: {
    position: 'absolute',
    width: OUTER_SIZE,
    height: OUTER_SIZE,
    borderRadius: OUTER_SIZE / 2,
    backgroundColor: colors.primary.blue100,
  },
  layerThree: {
    position: 'absolute',
    width: LAYER_THREE_SIZE,
    height: LAYER_THREE_SIZE,
    borderRadius: LAYER_THREE_SIZE / 2,
    backgroundColor: colors.primary.blue400,
  },
  layerTwo: {
    position: 'absolute',
    width: LAYER_TWO_SIZE,
    height: LAYER_TWO_SIZE,
    borderRadius: LAYER_TWO_SIZE / 2,
    backgroundColor: colors.primary.blue500,
  },
  innerCircle: {
    width: INNER_SIZE,
    height: INNER_SIZE,
    borderRadius: INNER_SIZE / 2,
    backgroundColor: colors.primary.blue600,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary.blue700,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 32,
    elevation: 14,
  },
});
