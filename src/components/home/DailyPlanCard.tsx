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
  duration?: string;
  streakDays?: number;
  onPress?: () => void;
}

export default function DailyPlanCard({
  streakDays = 7,
  onPress,
}: DailyPlanCardProps) {
  const navigation = useNavigation<MainTabNavigationProp<'Home'>>();
  const posthog = usePostHog();

  const handlePress = () => {
    posthog.capture(AnalyticsEvent.DailyPlanStarted, { streak_days: streakDays });
    if (onPress) return onPress();
    navigation.navigate('DailyExercise');
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={BREATHHOLD_CHALLENGE_BACKGROUND}
        style={styles.card}
        imageStyle={styles.cardImage}
        resizeMode="cover"
      >
        <View style={styles.imageOverlay} />
        <View style={styles.cardContent}>
          <View style={styles.leftCol}>
            <View style={styles.titleArea}>
              <View style={styles.labelChip}>
                <Text style={styles.labelText}>Daily Challenge</Text>
              </View>
              <Text style={styles.title}>Breathhold{'\n'}Challenge</Text>
            </View>
            <View style={styles.timeBadge}>
              <MaterialCommunityIcons name="clock-outline" size={14} color="rgba(255,255,255,0.82)" />
              <Text style={styles.timeText}>~3 min</Text>
            </View>
          </View>

          <View style={styles.rightCol}>
            <Pressable
              onPress={handlePress}
              style={({ pressed }) => [styles.playBtnShadow, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Start your daily breath hold challenge"
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
    paddingTop: spacing.xl,
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
    backgroundColor: 'rgba(20, 26, 46, 0.16)',
  },

  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  leftCol: {
    flex: 1,
    justifyContent: 'space-between',
  },
  rightCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleArea: {
    gap: spacing.sm,
  },
  labelChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  labelText: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.4,
  },
  title: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timeText: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    color: 'rgba(255,255,255,0.82)',
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
