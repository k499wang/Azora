import { StyleSheet, Text, View } from 'react-native';
import Icon from '../../common/icons/Icon';
import { card } from '../../../theme/card';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import {
  TECHNIQUE_RECOMMENDATIONS,
  progressionCopy,
} from '../data/techniqueRecommendations';
import type { BaselineResult } from './BaselineScreen';

interface RecommendationScreenProps {
  techniqueId: string;
  intentTitle: string;
  age: number;
  dailyMinutes: number;
  baseline: BaselineResult | null;
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

export default function RecommendationScreen({
  techniqueId,
  intentTitle,
  age,
  dailyMinutes,
  baseline,
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: RecommendationScreenProps) {
  const technique =
    TECHNIQUE_RECOMMENDATIONS[techniqueId] ?? TECHNIQUE_RECOMMENDATIONS.box;
  const progression = progressionCopy(age, dailyMinutes);

  const hrCompleted = baseline?.completed === true && baseline.avgBpm != null;
  const drop = baseline?.bpmDrop ?? 0;
  const hrDropPositive = hrCompleted && drop > 1;

  return (
    <OnboardingScreenLayout
      title="Your starting plan"
      subtitle={`Tailored to ${intentTitle.toLowerCase()}, your age, and how your body responded.`}
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Sounds good" onPress={onContinue} />}
    >
      {hrCompleted ? (
        <View style={styles.hrCard}>
          <View style={styles.hrLeft}>
            <Text style={styles.hrLabel}>Resting HR</Text>
            <View style={styles.hrValueRow}>
              <Text style={styles.hrValue}>{baseline?.avgBpm}</Text>
              <Text style={styles.hrUnit}>bpm</Text>
            </View>
          </View>
          {hrDropPositive ? (
            <View style={styles.hrRight}>
              <Icon name="heart-glow" size={18} color={colors.success[500]} />
              <Text style={styles.hrDropText}>
                ↓ {drop} bpm{'\n'}during breathing
              </Text>
            </View>
          ) : (
            <View style={styles.hrRight}>
              <Icon name="waves" size={18} color={colors.primary.blue600} />
              <Text style={styles.hrSteadyText}>Steady{'\n'}baseline</Text>
            </View>
          )}
        </View>
      ) : null}

      <View style={styles.techniqueCard}>
        <Text style={styles.techniqueKicker}>RECOMMENDED TECHNIQUE</Text>
        <Text style={styles.techniqueName}>{technique.name}</Text>
        <Text style={styles.techniqueTagline}>{technique.tagline}</Text>
        <View style={styles.divider} />
        <Text style={styles.techniqueWhy}>{technique.why}</Text>
      </View>

      <View style={styles.planRow}>
        <Icon name="streak" size={20} color={colors.orange[500]} />
        <Text style={styles.planText}>{progression}</Text>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  hrCard: {
    ...card.base,
    marginTop: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
  },
  hrLeft: {
    gap: spacing.xs,
  },
  hrLabel: {
    ...typography.caption.caption2,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: colors.text.tertiary,
  },
  hrValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  hrValue: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -1,
    color: colors.text.primary,
  },
  hrUnit: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  hrRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  hrDropText: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.success[700],
  },
  hrSteadyText: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  techniqueCard: {
    ...card.base,
    ...card.shadow,
    marginTop: spacing.md,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: 24,
    gap: spacing.xs,
  },
  techniqueKicker: {
    ...typography.caption.caption2,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    letterSpacing: 2,
    color: colors.primary.blue600,
  },
  techniqueName: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.4,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  techniqueTagline: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
    marginVertical: spacing.md,
  },
  techniqueWhy: {
    ...typography.body.small,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  planText: {
    ...typography.body.small,
    color: colors.text.primary,
    flex: 1,
  },
});
