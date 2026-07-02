import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePostHog } from 'posthog-react-native';
import Icon, { type IconName } from '../common/icons/Icon';
import { colors } from '../../theme/colors';
import { card } from '../../theme/card';
import { fonts, typography } from '../../theme/typography';
import { spacing, padding } from '../../theme/spacing';
import TECHNIQUES, { type BreathingTechnique } from '../../data/techniques';
import { AnalyticsEvent } from '../../services/analytics/events';
import { trackFeatureGateHit } from '../../services/analytics/tracking';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { PaywallPlacement } from '../../services/paywall';
import { FeatureKey } from '../../services/subscriptions/featureAccess';
import type { FeatureAccessResult } from '../../services/subscriptions/featureAccess';
import type { MainTabNavigationProp } from '../../app/navigation';

interface BreathGoal {
  key: string;
  label: string;
  icon: IconName;
  techniqueId: string;
}

const GOALS: BreathGoal[] = [
  { key: 'calm', label: 'Calm', icon: 'lotus', techniqueId: 'relaxing' },
  { key: 'energy', label: 'Energy', icon: 'sun', techniqueId: 'wimhof' },
  { key: 'sleep', label: 'Sleep', icon: 'moon', techniqueId: '478' },
];

function formatPattern(p: BreathingTechnique['pattern']) {
  return [p.inhale, p.holdIn, p.exhale, p.holdOut].filter((v) => v > 0).join('-');
}

function GoalCard({
  goal,
  technique,
  exerciseAccess,
}: {
  goal: BreathGoal;
  technique: BreathingTechnique;
  exerciseAccess: FeatureAccessResult & { isLoading: boolean };
}) {
  const navigation = useNavigation<MainTabNavigationProp<'Home'>>();
  const posthog = usePostHog();

  const handlePress = () => {
    posthog.capture(AnalyticsEvent.BreathingTechniqueSelected, {
      technique_id: technique.id,
      technique_name: technique.name,
      technique_category: technique.category,
      pattern: formatPattern(technique.pattern),
      recommended: false,
      source_action: 'goal_shortcut',
    });

    if (!exerciseAccess.allowed && !exerciseAccess.isLoading) {
      trackFeatureGateHit({
        feature: FeatureKey.DailyExercise,
        placement: PaywallPlacement.ExercisePremiumGate,
        sourceScreen: 'Home',
        sourceAction: 'goal_shortcut',
        access: exerciseAccess,
      });
      navigation.navigate('ProPaywall', {
        placement: PaywallPlacement.ExercisePremiumGate,
        sourceScreen: 'Home',
        sourceAction: 'goal_shortcut',
        feature: FeatureKey.DailyExercise,
      });
      return;
    }

    navigation.navigate('ExerciseSession', { techniqueId: technique.id });
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.cardWrap, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${goal.label} breathing exercise`}
    >
      <View style={styles.card}>
        <Icon name={goal.icon} size={30} color={colors.primary.blue600} />
        <Text style={styles.label}>{goal.label}</Text>
      </View>
    </Pressable>
  );
}

export default function BreathGoalCards() {
  const exerciseAccess = useFeatureAccess(FeatureKey.DailyExercise);
  const goals = useMemo(
    () =>
      GOALS.map((goal) => ({
        goal,
        technique: TECHNIQUES.find((t) => t.id === goal.techniqueId) ?? null,
      })).filter(
        (g): g is { goal: BreathGoal; technique: BreathingTechnique } =>
          g.technique != null,
      ),
    [],
  );

  return (
    <View style={styles.row}>
      {goals.map(({ goal, technique }) => (
        <GoalCard
          key={goal.key}
          goal={goal}
          technique={technique}
          exerciseAccess={exerciseAccess}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: padding.screen.horizontal,
    gap: spacing.md,
  },
  cardWrap: {
    flex: 1,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  card: {
    ...card.base,
    ...card.shadow,
    backgroundColor: colors.glass.fillStrong,
    aspectRatio: 1.25,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  label: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
});
