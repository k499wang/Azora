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
import { typography } from '../../theme/typography';
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
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Start your daily breath hold challenge"
    >
      <ImageBackground
        source={BREATHHOLD_CHALLENGE_BACKGROUND}
        style={styles.card}
        imageStyle={styles.cardImage}
        resizeMode="cover"
      >
        <View style={styles.imageOverlay} />
        <View style={styles.cardContent}>
          <View style={styles.titleArea}>
            <Text style={styles.title}>Breathhold Challenge</Text>
          </View>

          <View style={styles.playPillShadow}>
            {canUseLiquidGlass ? (
              <GlassView
                colorScheme="light"
                glassEffectStyle="clear"
                isInteractive
                style={styles.playPill}
                tintColor="rgba(255,255,255,0.48)"
              >
                <View style={styles.playPillContent}>
                  <MaterialCommunityIcons name="play" size={18} color={colors.primary.blue600} />
                  <Text style={styles.playPillText}>Start</Text>
                </View>
              </GlassView>
            ) : (
              <View style={[styles.playPill, styles.playPillFallback]}>
                <View style={styles.playPillContent}>
                  <MaterialCommunityIcons name="play" size={18} color={colors.primary.blue600} />
                  <Text style={styles.playPillText}>Start</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: 24,
    shadowColor: colors.primary.blue700,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 4,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
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
    alignItems: 'center',
  },
  title: {
    ...typography.title.title2,
    color: colors.text.inverse,
    textAlign: 'center',
  },
  titleArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  playPillShadow: {
    borderRadius: 999,
    shadowColor: colors.primary.blue700,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  playPill: {
    minWidth: 116,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    shadowOpacity: 0,
    elevation: 0,
    overflow: 'hidden',
  },
  playPillFallback: {
    backgroundColor: 'rgba(255,255,255,0.68)',
  },
  playPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  playPillText: {
    ...typography.button.medium,
    color: colors.primary.blue600,
  },
});
