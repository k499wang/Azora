import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { isHapticsEnabled } from '../../services/preferences/hapticsPreference';
import type { ExerciseDarkTheme } from '../../theme/exerciseDarkThemes';

interface RoundsHapticPickerProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  theme: ExerciseDarkTheme;
}

const STEP_DISTANCE = 22;
const HINT_SEEN_KEY = 'exercise:rounds_picker_hint_seen';
const TICK_COUNT = 7;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export default function RoundsHapticPicker({
  value,
  min,
  max,
  onChange,
  theme,
}: RoundsHapticPickerProps) {
  const valueRef = useRef(value);
  valueRef.current = value;
  const dragStartValueRef = useRef(value);
  const lastEmittedRef = useRef(value);

  const scale = useRef(new Animated.Value(1)).current;
  const hintOpacity = useRef(new Animated.Value(0)).current;
  const [hintVisible, setHintVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(HINT_SEEN_KEY)
      .then((seen) => {
        if (cancelled || seen === 'true') return;
        setHintVisible(true);
        Animated.timing(hintOpacity, {
          toValue: 1,
          duration: 400,
          delay: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [hintOpacity]);

  const dismissHint = () => {
    if (!hintVisible) return;
    Animated.timing(hintOpacity, {
      toValue: 0,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setHintVisible(false);
    });
    AsyncStorage.setItem(HINT_SEEN_KEY, 'true').catch(() => {});
  };

  const pulseScale = () => {
    scale.stopAnimation();
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.06,
        speed: 24,
        bounciness: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        speed: 18,
        bounciness: 6,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const fireHaptic = () => {
    if (!isHapticsEnabled()) return;
    Haptics.selectionAsync().catch(() => {});
  };

  const handleMove = (_: GestureResponderEvent, gesture: PanResponderGestureState) => {
    const deltaSteps = Math.round(gesture.dx / STEP_DISTANCE);
    const next = clamp(dragStartValueRef.current + deltaSteps, min, max);
    if (next !== lastEmittedRef.current) {
      lastEmittedRef.current = next;
      fireHaptic();
      pulseScale();
      onChange(next);
    }
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 2,
        onPanResponderGrant: () => {
          dragStartValueRef.current = valueRef.current;
          lastEmittedRef.current = valueRef.current;
          dismissHint();
        },
        onPanResponderMove: handleMove,
        onPanResponderRelease: () => {
          dragStartValueRef.current = valueRef.current;
        },
        onPanResponderTerminate: () => {
          dragStartValueRef.current = valueRef.current;
        },
      }),
    // handleMove/dismissHint close over stable refs and state setters; deps intentionally empty.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [min, max, onChange],
  );

  return (
    <View style={styles.wrap} {...panResponder.panHandlers}>
      <Animated.Text
        style={[
          styles.value,
          { color: theme.textPrimary, transform: [{ scale }] },
        ]}
        allowFontScaling={false}
      >
        {value}
      </Animated.Text>
      <Text style={[styles.label, { color: theme.textTertiary }]}>rounds</Text>

      <View style={styles.tickRail} pointerEvents="none">
        {Array.from({ length: TICK_COUNT }).map((_, i) => {
          const isCenter = i === Math.floor(TICK_COUNT / 2);
          return (
            <View
              key={i}
              style={[
                styles.tick,
                {
                  backgroundColor: theme.textTertiary,
                  opacity: isCenter ? 0.5 : 0.18,
                  width: isCenter ? 18 : 12,
                },
              ]}
            />
          );
        })}
      </View>

      {hintVisible ? (
        <Animated.Text
          style={[
            styles.hint,
            { color: theme.textTertiary, opacity: hintOpacity },
          ]}
          pointerEvents="none"
        >
          Swipe to adjust
        </Animated.Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    minHeight: 120,
  },
  value: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 56,
    lineHeight: 62,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  label: {
    ...typography.caption.caption1,
    marginTop: 2,
    letterSpacing: 0.6,
    textTransform: 'lowercase',
  },
  tickRail: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.sm,
    height: 4,
  },
  tick: {
    height: 2,
    borderRadius: 1,
  },
  hint: {
    ...typography.caption.caption2,
    marginTop: spacing.xs,
    letterSpacing: 0.4,
  },
});
