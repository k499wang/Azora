import { useEffect } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { spacing, padding } from '../../theme/spacing';
import { typography, fonts } from '../../theme/typography';
import {
  DEFAULT_CAPTURE_MODE,
  getCaptureModeConfig,
} from '../../lib/heartRate/captureModes';

interface MeasureHeroCardProps {
  onPress: () => void;
  /**
   * Optional override of the subtitle. The default copy is used in
   * production; tests/screenshots may want a custom label.
   */
  subtitle?: string;
}

const PULSE_DURATION_MS = 1400;

/**
 * The single most prominent card on the Heart tab. Tap it to open the camera
 * capture flow. Visual hierarchy intentionally differs from the Home tab's
 * DailyPlanCard so users feel this launches hardware measurement, not a
 * breathing hold.
 *
 * The heart-pulse icon has a soft halo behind it that breathes on a 1.4s
 * loop to signal "live sensor" without distracting from the title.
 */
export function MeasureHeroCard({
  onPress,
  subtitle = `Tap to start a ${getCaptureModeConfig(DEFAULT_CAPTURE_MODE).durationMs / 1000}-second reading`,
}: MeasureHeroCardProps) {
  const haloProgress = useSharedValue(0);

  useEffect(() => {
    haloProgress.value = withRepeat(
      withTiming(1, {
        duration: PULSE_DURATION_MS,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
    return () => {
      cancelAnimation(haloProgress);
    };
  }, [haloProgress]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.18 + haloProgress.value * 0.22,
    transform: [{ scale: 0.72 + haloProgress.value * 1.05 }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Measure heart rate"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.iconBubble}>
        {/* Decorative halo — purely visual so it should never swallow taps. */}
        <Animated.View
          pointerEvents="none"
          style={[styles.halo, haloStyle]}
        />
        <MaterialCommunityIcons
          name="heart-pulse"
          size={28}
          color={colors.text.inverse}
        />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>Measure heart rate</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <View style={styles.chevronWrap}>
        <MaterialCommunityIcons
          name="chevron-right"
          size={22}
          color={colors.text.tertiary}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: padding.screen.horizontal,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    backgroundColor: colors.error[500],
    shadowColor: colors.error[700],
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  cardPressed: {
    opacity: 0.92,
  },
  iconBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  /**
   * Halo sits behind the heart icon. It scales 0.72→1.77 while its opacity
   * rises 0.18→0.40, then reverses for a calm breath. `overflow: hidden` on the
   * bubble keeps the halo clipped to the circle so it never bleeds into the
   * card surface.
   */
  halo: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.text.inverse,
    left: 0,
    top: 0,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
  },
  subtitle: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: 'rgba(255,255,255,0.85)',
  },
  chevronWrap: {
    width: 28,
    alignItems: 'flex-end',
  },
});
