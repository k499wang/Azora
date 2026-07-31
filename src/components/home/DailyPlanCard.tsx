import { Text } from '../common/Text';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { usePostHog } from 'posthog-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GlassSurface from '../common/GlassSurface';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { fonts, typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { AnalyticsEvent } from '../../services/analytics/events';
import { DAILY_PLAN_BACKGROUND_ASSET } from '../../data/backgroundAssets';
import { getBackgroundImageSource } from '../../services/images/backgroundImageCache';
import type { MainTabNavigationProp } from '../../app/navigation';

const SESSION_DURATION = '~2 min';

interface DailyPlanCardProps {
  todayHoldSeconds: number | null;
  lastHoldSeconds: number | null;
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

  const status = !hasHistory
    ? null
    : doneToday
      ? `Done today ${formatMmSs(todayHoldSeconds!)}`
      : `Last hold ${formatMmSs(lastHoldSeconds!)}`;

  const meta = status ? `${status} · ${SESSION_DURATION}` : SESSION_DURATION;

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={
          doneToday ? 'Try another breath hold' : 'Start your daily breath hold'
        }
        style={({ pressed }) => pressed && styles.pressed}
      >
        <View style={styles.mediaShadow}>
          <View style={styles.media}>
            <Image
              source={getBackgroundImageSource('dailyPlan')}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              contentPosition="center"
              transition={0}
              cachePolicy="memory-disk"
            />
            <LinearGradient
              colors={[colors.photoScrim.transparent, colors.photoScrim.medium]}
              locations={[0.45, 1]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View style={[styles.dailyPill, styles.originalPill]} pointerEvents="none">
              <Text style={styles.dailyPillText}>Azora Original</Text>
            </View>
            <View style={styles.mediaFooter} pointerEvents="none">
              <View style={styles.dailyPill}>
                <Text style={styles.dailyPillText}>Check-in</Text>
              </View>
              <GlassSurface
                bare
                variant="clear"
                style={styles.playBtn}
              >
                <MaterialCommunityIcons name="play" size={14} color={colors.text.inverse} />
              </GlassSurface>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <MaterialCommunityIcons name="play" size={18} color={colors.text.primary} />
            <Text style={styles.title}>Azora's Breathhold Exercise</Text>
          </View>
          <Text style={styles.meta}>{meta}</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  mediaShadow: {
    ...card.shadow,
    borderRadius: 22,
    backgroundColor: DAILY_PLAN_BACKGROUND_ASSET.fallbackColor,
  },
  media: {
    height: 176,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: DAILY_PLAN_BACKGROUND_ASSET.fallbackColor,
  },
  mediaFooter: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  dailyPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  originalPill: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: colors.primary.blue600,
    borderWidth: 0,
  },
  dailyPillText: {
    ...typography.caption.caption2,
    fontFamily: fonts.medium,
    color: colors.text.inverse,
  },
  body: {
    paddingTop: spacing.xs,
    paddingLeft: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.heading.heading1,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  meta: {
    ...typography.label.medium,
    fontFamily: fonts.medium,
    color: colors.text.secondary,
  },
  playBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
