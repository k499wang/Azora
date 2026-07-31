import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BREATH_BACKDROP_LOCATIONS,
  type ExerciseDarkTheme,
} from '../../../../theme/exerciseDarkThemes';

export type BreathBackdropPhase = 'inhale' | 'exhale' | 'hold' | 'idle';

interface BreathBackdropProps {
  theme: ExerciseDarkTheme;
  phase: BreathBackdropPhase;
  inhaleSeconds: number;
  exhaleSeconds: number;
  paused?: boolean;
}

const IDLE_SETTLE_MS = 700;

export default function BreathBackdrop({
  theme,
  phase,
  inhaleSeconds,
  exhaleSeconds,
  paused = false,
}: BreathBackdropProps) {
  const inhaleAmount = useRef(new Animated.Value(0)).current;
  const settledAmountRef = useRef(0);

  useEffect(() => {
    let disposed = false;
    let animation: Animated.CompositeAnimation | null = null;

    inhaleAmount.stopAnimation((value) => {
      if (disposed) return;

      settledAmountRef.current = value;

      if (paused || phase === 'hold') return;

      const target = phase === 'inhale' ? 1 : 0;
      const phaseSeconds = phase === 'inhale' ? inhaleSeconds : exhaleSeconds;
      // Each phase starts from the gradient's rendered position so an early
      // transition continues smoothly instead of jumping to a stale endpoint.
      const remaining = Math.abs(target - value);
      const duration =
        phase === 'idle'
          ? IDLE_SETTLE_MS
          : Math.max(0, phaseSeconds * 1000 * remaining);

      animation = Animated.timing(inhaleAmount, {
        toValue: target,
        duration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      });

      animation.start(({ finished }) => {
        if (!disposed && finished) settledAmountRef.current = target;
      });
    });

    return () => {
      disposed = true;
      animation?.stop();
    };
  }, [exhaleSeconds, inhaleAmount, inhaleSeconds, paused, phase]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={theme.backdropExhale}
        locations={BREATH_BACKDROP_LOCATIONS}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: inhaleAmount }]}
      >
        <LinearGradient
          colors={theme.backdropInhale}
          locations={BREATH_BACKDROP_LOCATIONS}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}
