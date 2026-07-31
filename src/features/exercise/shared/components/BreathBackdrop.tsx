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
    if (paused) {
      inhaleAmount.stopAnimation((value) => {
        settledAmountRef.current = value;
      });
      return;
    }

    if (phase === 'hold') return;

    const target = phase === 'inhale' ? 1 : 0;
    const phaseSeconds = phase === 'inhale' ? inhaleSeconds : exhaleSeconds;
    // Resuming mid-phase covers only the distance that is left, so the wash
    // stays in step with the circle instead of restarting the full sweep.
    const remaining = Math.abs(target - settledAmountRef.current);
    const duration =
      phase === 'idle'
        ? IDLE_SETTLE_MS
        : Math.max(0, phaseSeconds * 1000 * remaining);

    const animation = Animated.timing(inhaleAmount, {
      toValue: target,
      duration,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    });

    animation.start(({ finished }) => {
      if (finished) settledAmountRef.current = target;
    });

    return () => animation.stop();
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
