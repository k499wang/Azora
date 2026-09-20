import { StyleSheet, View } from 'react-native';
import { Text } from '../../common/Text';
import Icon from '../../common/icons/Icon';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import type { OnboardingIntent } from '../../onboarding/types';

interface GoalsRecapSectionProps {
  selectedIntents?: OnboardingIntent[];
}

const INTENT_LABELS: Record<OnboardingIntent, string> = {
  stress_relief: 'Stress relief',
  calm_fast: 'Quick calm',
  sleep: 'Better sleep',
  focus: 'Sharper focus',
  energy: 'More energy',
  self_acceptance: 'Self-acceptance',
  emotional_balance: 'Emotional balance',
  self_care: 'Self-care',
  spiritual: 'Spiritual growth',
  yoga: 'Yoga',
  heart_health: 'Heart health',
  daily_habit: 'Daily habits',
  other: 'Personal growth',
};

const PROBLEM_AGITATION: Record<OnboardingIntent, string> = {
  stress_relief: "You deserve to feel calm, not constantly on edge.",
  calm_fast: "Anxiety shouldn't control your day.",
  sleep: "Wrestling with sleep robs you of tomorrow's energy.",
  focus: "Scattered attention steals your best work.",
  energy: "Dragging through the afternoon is no way to live.",
  self_acceptance: "You shouldn't have to earn your own kindness.",
  emotional_balance: "Ups and downs shouldn't define your week.",
  self_care: "You give enough — it's time to give to yourself.",
  spiritual: "Your inner life matters as much as your outer one.",
  yoga: "Your body and mind deserve time together.",
  heart_health: "Your heart works hard — it deserves your attention.",
  daily_habit: "Small daily actions compound into real change.",
  other: "You know something needs to shift.",
};

export function GoalsRecapSection({ selectedIntents }: GoalsRecapSectionProps) {
  if (!selectedIntents || selectedIntents.length === 0) return null;

  const primaryProblem = PROBLEM_AGITATION[selectedIntents[0]];

  return (
    <View style={styles.container}>
      {/* Goals recap */}
      <View style={styles.goalsCard}>
        <Text style={styles.goalsTitle}>Your goals</Text>
        <View style={styles.goalsList}>
          {selectedIntents.map((intent) => (
            <View key={intent} style={styles.goalRow}>
              <View style={styles.checkCircle}>
                <Icon name="check" size={12} color={colors.primary.blue500} />
              </View>
              <Text style={styles.goalText}>{INTENT_LABELS[intent]}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Problem agitation */}
      {primaryProblem ? (
        <View style={styles.agitationCard}>
          <Text style={styles.agitationText}>{primaryProblem}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  goalsCard: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.subtle,
  },
  goalsTitle: {
    ...typography.caption.caption1,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  goalsList: {
    gap: spacing.xs,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary.blue100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalText: {
    ...typography.body.medium,
    color: colors.text.primary,
  },
  agitationCard: {
    backgroundColor: colors.primary.blue50,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary.blue200,
  },
  agitationText: {
    ...typography.heading.heading2,
    color: colors.primary.blue700,
    textAlign: 'center',
  },
});
