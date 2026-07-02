import { useCallback } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
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

  useFocusEffect(
    useCallback(() => {
      try {
        player.play();
      } catch {}
      return () => {
        try {
          player.pause();
        } catch {}
      };
    }, [player]),
  );

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

  const meta =
    bestHoldSeconds != null && bestHoldSeconds > 0
      ? `${subtitle} · Best ${formatMmSs(bestHoldSeconds)}`
      : subtitle;

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
          colors={[colors.photoScrim.transparent, colors.photoScrim.transparent, colors.photoScrim.strong]}
          locations={[0, 0.35, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.challengeIcon} pointerEvents="none">
          <MaterialCommunityIcons name="lungs" size={24} color={colors.text.inverse} />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.metricBlock}>
            <View style={styles.titleBlock}>
              <View style={styles.overlineSpacer} />
              <Text style={styles.startTitle}>Breathhold{'\n'}Exercise</Text>
            </View>
            <Text style={styles.meta}>{meta}</Text>
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
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  metricBlock: {
    flex: 1,
  },
  titleBlock: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  overlineSpacer: {
    height: typography.overline.lineHeight,
  },
  challengeIcon: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.lg,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    ...typography.label.medium,
    color: 'rgba(255,255,255,0.78)',
    position: 'absolute',
    left: 0,
    bottom: 0,
  },
  startTitle: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontSize: 22,
    color: colors.text.inverse,
    lineHeight: 26,
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
