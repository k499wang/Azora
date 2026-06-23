import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePostHog } from 'posthog-react-native';
import Icon, { type IconName } from '../common/icons/Icon';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { AnalyticsEvent } from '../../services/analytics/events';
import { trackFeatureGateHit } from '../../services/analytics/tracking';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { PaywallPlacement } from '../../services/paywall';
import { FeatureKey } from '../../services/subscriptions/featureAccess';
import type { MainTabNavigationProp } from '../../app/navigation';

interface Emotion {
  key: string;
  icon: IconName;
  color: string;
  label: string;
  techniqueId: string;
}

const EMOTIONS: Emotion[] = [
  { key: 'calm', icon: 'face-calm', color: colors.success[500], label: 'Calm', techniqueId: 'relaxing' },
  { key: 'happy', icon: 'face-happy', color: colors.warning[500], label: 'Happy', techniqueId: 'box' },
  { key: 'sad', icon: 'face-sad', color: colors.primary.blue500, label: 'Sad', techniqueId: 'resonance' },
  { key: 'angry', icon: 'face-angry', color: colors.error[400], label: 'Angry', techniqueId: '478' },
  { key: 'anxious', icon: 'face-anxious', color: colors.mood.anxious, label: 'Anxious', techniqueId: '478' },
  { key: 'tired', icon: 'face-tired', color: colors.accent[500], label: 'Tired', techniqueId: 'wimhof' },
];

export default function EmotionRow() {
  const navigation = useNavigation<MainTabNavigationProp<'Home'>>();
  const posthog = usePostHog();
  const exerciseAccess = useFeatureAccess(FeatureKey.DailyExercise);

  const handleSelect = (emotion: Emotion) => {
    posthog.capture(AnalyticsEvent.BreathingTechniqueSelected, {
      technique_id: emotion.techniqueId,
      emotion: emotion.key,
      source: 'emotion_row',
    });

    if (!exerciseAccess.allowed && !exerciseAccess.isLoading) {
      trackFeatureGateHit({
        feature: FeatureKey.DailyExercise,
        placement: PaywallPlacement.ExercisePremiumGate,
        sourceScreen: 'Home',
        sourceAction: 'emotion_row',
        access: exerciseAccess,
      });
      navigation.navigate('ProPaywall', {
        placement: PaywallPlacement.ExercisePremiumGate,
        sourceScreen: 'Home',
        sourceAction: 'emotion_row',
        feature: FeatureKey.DailyExercise,
      });
      return;
    }

    navigation.navigate('ExerciseSession', { techniqueId: emotion.techniqueId });
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {EMOTIONS.map((emotion) => (
        <Pressable
          key={emotion.key}
          onPress={() => handleSelect(emotion)}
          accessibilityRole="button"
          accessibilityLabel={`${emotion.label} — start a breathing exercise`}
          style={({ pressed }) => [
            styles.item,
            pressed && styles.pressed,
          ]}
        >
          <Icon name={emotion.icon} size={60} color={emotion.color} />
          <Text style={styles.label} numberOfLines={1}>
            {emotion.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.lg,
    paddingRight: spacing.lg,
  },
  item: {
    width: 60,
    alignItems: 'center',
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.6,
    transform: [{ scale: 0.94 }],
  },
  label: {
    ...typography.label.large,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
  },
});
