import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePostHog } from 'posthog-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
import { colors } from '../../theme/colors';
import { fonts, typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { AnalyticsEvent } from '../../services/analytics/events';
import type { MainTabNavigationProp } from '../../app/navigation';

const canUseLiquidGlass = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
const BREATHHOLD_CHALLENGE_BACKGROUND = require('../../../assets/back.avif');

interface DailyPlanCardProps {
  todayHoldSeconds: number | null;
  lastHoldSeconds: number | null;
  bestHoldSeconds: number | null;
  streakDays?: number;
  onPress?: () => void;
}

function formatMmSs(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function DailyPlanCard({
  todayHoldSeconds,
  lastHoldSeconds,
  bestHoldSeconds,
  streakDays = 0,
  onPress,
}: DailyPlanCardProps) {
  const navigation = useNavigation<MainTabNavigationProp<'Home'>>();
  const posthog = usePostHog();

  const handlePress = () => {
    posthog.capture(AnalyticsEvent.DailyPlanStarted, { streak_days: streakDays });
    if (onPress) return onPress();
    navigation.navigate('DailyExercise');
  };

  const hasHistory = lastHoldSeconds != null || todayHoldSeconds != null;
  const doneToday = todayHoldSeconds != null;

  const subtitle = !hasHistory
    ? 'Find your baseline'
    : doneToday
      ? `Done today · ${formatMmSs(todayHoldSeconds!)}`
      : `Last hold ${formatMmSs(lastHoldSeconds!)}`;

  const bestLabel =
    bestHoldSeconds != null && bestHoldSeconds > 0
      ? `Best ${formatMmSs(bestHoldSeconds)}`
      : 'Best —';

  return (
    <View style={styles.container}>
      <ImageBackground
        source={BREATHHOLD_CHALLENGE_BACKGROUND}
        style={styles.card}
        imageStyle={styles.cardImage}
        resizeMode="cover"
      >
        <View style={styles.imageOverlay} />
        <View style={styles.bestBadge} pointerEvents="none">
          <Text style={styles.bestBadgeText}>{bestLabel}</Text>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.leftCol}>
            <View style={styles.metricBlock}>
              <Text style={styles.startTitle}>Breathhold</Text>
              <Text style={styles.startTitle}>Exercise</Text>
              <Text style={styles.caption}>{subtitle}</Text>
            </View>
          </View>

          <View style={styles.rightCol}>
            <Pressable
              onPress={handlePress}
              style={({ pressed }) => [styles.playBtnShadow, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={doneToday ? 'Try another breath hold' : 'Start your daily breath hold'}
            >
              {canUseLiquidGlass ? (
                <GlassView
                  colorScheme="light"
                  glassEffectStyle="clear"
                  isInteractive
                  style={styles.playBtn}
                  tintColor="rgba(255,255,255,0.48)"
                >
                  <MaterialCommunityIcons name="play" size={30} color={colors.primary.blue600} />
                </GlassView>
              ) : (
                <View style={[styles.playBtn, styles.playBtnFallback]}>
                  <MaterialCommunityIcons name="play" size={30} color={colors.primary.blue600} />
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    shadowColor: colors.primary.blue700,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 4,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  card: {
    minHeight: 176,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.primary.blue600,
  },
  cardImage: {
    borderRadius: 24,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 26, 46, 0.22)',
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  leftCol: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  rightCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricBlock: {
    gap: 2,
    marginTop: spacing.md,
  },
  metric: {
    ...typography.display.display2,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
    lineHeight: 44,
    includeFontPadding: false,
  },
  startTitle: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
  },
  caption: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    color: 'rgba(255,255,255,0.78)',
  },
  bestBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.lg,
  },
  bestBadgeText: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    color: colors.orange[300],
    letterSpacing: 0.4,
  },
  playBtnShadow: {
    borderRadius: 999,
    shadowColor: colors.primary.blue700,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  playBtnFallback: {
    backgroundColor: 'rgba(255,255,255,0.68)',
  },
});
