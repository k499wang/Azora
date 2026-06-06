import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePostHog } from 'posthog-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import GlassSurface from '../common/GlassSurface';
import { colors } from '../../theme/colors';
import { fonts, typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { AnalyticsEvent } from '../../services/analytics/events';
import type { MainTabNavigationProp } from '../../app/navigation';

const BREATHHOLD_CHALLENGE_BACKGROUND = require('../../../assets/daily-plan-background.mp4');
const BREATHHOLD_CHALLENGE_POSTER = require('../../../assets/daily-plan-poster.jpg');

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

  const player = useVideoPlayer(BREATHHOLD_CHALLENGE_BACKGROUND, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

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
      <View style={styles.card}>
        <Image
          source={BREATHHOLD_CHALLENGE_POSTER}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <VideoView
          style={StyleSheet.absoluteFill}
          player={player}
          contentFit="cover"
          nativeControls={false}
          pointerEvents="none"
        />
        <LinearGradient
          colors={['transparent', 'rgba(12, 16, 33, 0.0)', 'rgba(12, 16, 33, 0.82)']}
          locations={[0, 0.35, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.bestBadge} pointerEvents="none">
          <GlassSurface
            bare
            variant="clear"
            style={styles.bestBadgeGlass}
            tintColor={colors.glass.tintOnImage}
            blurColor={colors.glass.fillOnImage}
            solidColor={colors.glass.fillOnImage}
          >
            <Text style={styles.bestBadgeText}>{bestLabel}</Text>
          </GlassSurface>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.metricBlock}>
            <Text style={styles.startTitle}>Breathhold</Text>
            <Text style={styles.startTitle}>Exercise</Text>
          </View>

          <Pressable
            onPress={handlePress}
            style={({ pressed }) => [styles.playBtnShadow, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={doneToday ? 'Try another breath hold' : 'Start your daily breath hold'}
          >
            <GlassSurface
              bare
              interactive
              variant="clear"
              style={styles.playBtn}
              tintColor={colors.glass.tintOnImage}
              blurColor={colors.glass.fillOnImage}
              solidColor={colors.glass.fillOnImage}
            >
              <MaterialCommunityIcons name="play" size={30} color={colors.primary.blue600} />
            </GlassSurface>
          </Pressable>
        </View>
        <Text style={styles.caption} pointerEvents="none">{subtitle}</Text>
      </View>
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
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricBlock: {
    flex: 1,
  },
  startTitle: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
    lineHeight: 26,
  },
  caption: {
    position: 'absolute',
    left: spacing.lg,
    bottom: spacing.lg,
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    color: 'rgba(255,255,255,0.78)',
  },
  bestBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.lg,
    borderRadius: 999,
  },
  bestBadgeGlass: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    overflow: 'hidden',
  },
  bestBadgeText: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    color: colors.primary.blue800,
    letterSpacing: 0.4,
  },
  playBtnShadow: {
    alignSelf: 'center',
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
});
