import { Text, AnimatedText } from '../../../../components/common/Text';
import { useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { spacing } from '../../../../theme/spacing';
import { fonts, typography } from '../../../../theme/typography';
import { isHapticsEnabled } from '../../../../services/preferences/hapticsPreference';
import type { ExerciseDarkTheme } from '../../../../theme/exerciseDarkThemes';

interface RoundsHapticPickerProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  theme: ExerciseDarkTheme;
}

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
  const scale = useRef(new Animated.Value(1)).current;

  const fireHaptic = () => {
    if (!isHapticsEnabled()) return;
    Haptics.selectionAsync().catch(() => {});
  };

  const pulseScale = () => {
    scale.stopAnimation();
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.08,
        duration: 90,
        easing: Easing.out(Easing.cubic),
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

  const step = (direction: 1 | -1) => {
    const next = clamp(value + direction, min, max);
    if (next === value) return;
    fireHaptic();
    pulseScale();
    onChange(next);
  };

  const leftDisabled = value <= min;
  const rightDisabled = value >= max;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Chevron
          direction="left"
          color={theme.textPrimary}
          disabled={leftDisabled}
          onPress={() => step(-1)}
        />

        <AnimatedText
          style={[
            styles.value,
            { color: theme.textPrimary, transform: [{ scale }] },
          ]}
        >
          {value}
        </AnimatedText>

        <Chevron
          direction="right"
          color={theme.textPrimary}
          disabled={rightDisabled}
          onPress={() => step(1)}
        />
      </View>
      <Text style={[styles.label, { color: theme.textTertiary }]}>rounds</Text>
    </View>
  );
}

interface ChevronProps {
  direction: 'left' | 'right';
  color: string;
  disabled: boolean;
  onPress: () => void;
}

function Chevron({ direction, color, disabled, onPress }: ChevronProps) {
  const path = direction === 'left' ? 'M15 4 L7 12 L15 20' : 'M9 4 L17 12 L9 20';
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      hitSlop={14}
      style={({ pressed }) => [
        styles.chevronHit,
        { opacity: disabled ? 0.18 : pressed ? 0.55 : 0.7 },
      ]}
    >
      <Svg width={16} height={28} viewBox="0 0 24 24">
        <Path
          d={path}
          stroke={color}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  value: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 56,
    lineHeight: 62,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
    minWidth: 70,
    textAlign: 'center',
  },
  label: {
    ...typography.caption.caption1,
    letterSpacing: 0.6,
    textTransform: 'lowercase',
    marginTop: -2,
  },
  chevronHit: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
