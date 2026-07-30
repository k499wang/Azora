import { Text } from '../../common/Text';
import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import CardSurface from '../../common/CardSurface';
import MindMapRadar from '../MindMapRadar';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import TECHNIQUES from '../../../features/exercise/guidedBreathing/techniques';
import {
  formatPlanTime,
  formatRetestDate,
  type PlanAction,
  type OnboardingPlan,
} from '../../../lib/onboardingPlan';
import type { MindMapScore } from '../../../lib/onboardingScores';

interface RecommendedExerciseScreenProps {
  plan: OnboardingPlan;
  currentScores: MindMapScore[];
  targetScores: MindMapScore[];
  growthArea: MindMapScore;
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

function techniqueName(techniqueId: string | null): string | null {
  if (!techniqueId) return null;
  return TECHNIQUES.find((t) => t.id === techniqueId)?.name ?? null;
}

export default function RecommendedExerciseScreen({
  plan,
  currentScores,
  targetScores,
  growthArea,
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: RecommendedExerciseScreenProps) {
  const { width } = useWindowDimensions();
  const projection = plan.projection;
  const gain = projection
    ? projection.highSeconds - projection.baselineSeconds
    : null;

  const biggestLift = useMemo(() => {
    const growthTarget = targetScores.find(
      (score) => score.axis === growthArea.axis,
    );
    return growthTarget ? growthTarget.value - growthArea.value : null;
  }, [targetScores, growthArea]);

  return (
    <OnboardingScreenLayout
      title="Your custom plan is ready!"
      progress={stepIndex / stepCount}
      onBack={onBack}
      centerCopy
      titleStyle={styles.planTitle}
      footer={
        <OnboardingPrimaryButton label="Start my plan" onPress={onContinue} />
      }
    >
      <View style={styles.page}>
        <View style={styles.section}>
          <View style={styles.radarWrap}>
            <MindMapRadar
              scores={currentScores}
              targetScores={targetScores}
              labelScores={currentScores}
              size={width}
            />
          </View>

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={styles.legendDotToday} />
              <Text style={styles.legendLabel}>Today</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.legendDotTarget} />
              <Text style={styles.legendLabel}>With your plan</Text>
            </View>
          </View>

          <Text style={styles.note}>
            {biggestLift != null
              ? `${growthArea.label} climbs the most, about ${biggestLift} points, because both daily actions are chosen to lift it first.`
              : `${growthArea.label} has the most room to move, so both daily actions are chosen to lift it first.`}
          </Text>
        </View>

        {gain != null ? (
          <View style={styles.goalPill}>
            <Text style={styles.goalPillText}>
              {`Add ${gain}s to your breath hold by ${formatRetestDate(new Date())}`}
            </Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Do this every day</Text>
          {plan.actions.map((action) => (
            <ActionCard key={action.id} action={action} />
          ))}
        </View>
      </View>
    </OnboardingScreenLayout>
  );
}

function ActionCard({ action }: { action: PlanAction }) {
  const technique = techniqueName(action.techniqueId);

  return (
    <CardSurface style={styles.actionCard}>
      <View style={styles.actionHeader}>
        <Text style={styles.actionRole}>{technique ?? action.title}</Text>
        <View style={styles.actionMeta}>
          <Text style={styles.actionSubject}>{`${action.minutes} min`}</Text>
          <View style={styles.actionPill}>
            <Text style={styles.actionPillText}>
              {formatPlanTime(action.minutesFromMidnight)}
            </Text>
          </View>
        </View>
      </View>
      <Text style={styles.actionBody}>
        {technique
          ? 'Guided breathing, matched to the goals you picked.'
          : 'A short hold to track how your breathing is changing.'}
      </Text>
    </CardSurface>
  );
}

const styles = StyleSheet.create({
  planTitle: {
    fontSize: 32,
    lineHeight: 39,
    letterSpacing: -0.5,
  },
  page: {
    gap: spacing.xl,
  },
  goalPill: {
    alignSelf: 'center',
    borderRadius: 20,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary.blue100,
  },
  goalPillText: {
    ...typography.label.large,
    textAlign: 'center',
    color: colors.primary.blue600,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
  },
  actionCard: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  actionRole: {
    ...typography.heading.heading2,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.primary.blue600,
    flexShrink: 1,
  },
  actionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  actionSubject: {
    ...typography.heading.heading2,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
    flexShrink: 1,
  },
  actionPill: {
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.primary.blue600,
  },
  actionPillText: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    color: colors.neutral[0],
  },
  actionBody: {
    ...typography.body.small,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  radarWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -spacing.xl,
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.md,
    alignSelf: 'center',
    marginTop: -spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDotToday: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary.blue500,
  },
  legendDotTarget: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.orange[500],
  },
  legendLabel: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  note: {
    ...typography.body.small,
    textAlign: 'center',
    color: colors.text.secondary,
    lineHeight: 20,
  },
});
