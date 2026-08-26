import { Text } from '../../common/Text';
import { useMemo } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import CardSurface from '../../common/CardSurface';
import Icon from '../../common/icons/Icon';
import MindMapRadar from '../MindMapRadar';
import { useTimePickerSheet } from '../../common/useTimePickerSheet';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import MochiAside from '../MochiAside';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import TECHNIQUES from '../../../features/exercise/guidedBreathing/techniques';
import {
  formatPlanTime,
  formatRetestDate,
  fromClockString,
  planTimeOfDayLabel,
  toClockString,
  type PlanAction,
  type PlanActionId,
  type OnboardingPlan,
} from '../../../lib/onboardingPlan';
import type { MindMapScore } from '../../../lib/onboardingScores';
import { PERSONALIZED_INTENT_OPTIONS } from '../data/intentOptions';

interface RecommendedExerciseScreenProps {
  plan: OnboardingPlan;
  currentScores: MindMapScore[];
  targetScores: MindMapScore[];
  growthArea: MindMapScore;
  stepIndex: number;
  stepCount: number;
  onChangeActionTime: (
    actionId: PlanActionId,
    minutesFromMidnight: number,
  ) => void;
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
  onChangeActionTime,
  onContinue,
  onBack,
}: RecommendedExerciseScreenProps) {
  const { width } = useWindowDimensions();
  const lungAgeGoal = plan.lungAgeGoal;

  const biggestLift = useMemo(() => {
    const growthTarget = targetScores.find(
      (score) => score.axis === growthArea.axis,
    );
    return growthTarget ? growthTarget.value - growthArea.value : null;
  }, [targetScores, growthArea]);

  return (
    <OnboardingScreenLayout
      title="Your custom plan!"
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
              ? `${growthArea.label} climbs the most, about ${biggestLift} points, because your daily actions are chosen to lift it first.`
              : `${growthArea.label} has the most room to move, so your daily actions are chosen to lift it first.`}
          </Text>
        </View>

        {lungAgeGoal ? (
          <View style={styles.goalPill}>
            <Text style={styles.goalPillText}>
              {lungAgeGoal.mode === 'lower'
                ? `Lower my lung age to ${lungAgeGoal.targetYears} by ${formatRetestDate(new Date())}`
                : `Keep my lung age at ${lungAgeGoal.targetYears} through ${formatRetestDate(new Date())}`}
            </Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <MochiAside
            text="We made this plan for you:"
            variant="heading"
            expression="pleased"
          />
          {plan.actions.map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              body={actionBody(action, plan, growthArea)}
              onChangeTime={(minutes) => onChangeActionTime(action.id, minutes)}
            />
          ))}
        </View>
      </View>
    </OnboardingScreenLayout>
  );
}

function actionBody(
  action: PlanAction,
  plan: OnboardingPlan,
  growthArea: MindMapScore,
): string {
  const goalPhrase =
    PERSONALIZED_INTENT_OPTIONS.find((option) => option.id === plan.intent)
      ?.goalPhrase ?? null;
  const when = planTimeOfDayLabel(action.minutesFromMidnight).toLowerCase();

  if (action.id === 'session') {
    return goalPhrase
      ? `${action.minutes} minutes every ${when}, chosen to help you ${goalPhrase}.`
      : `${action.minutes} minutes of guided breathing every ${when}.`;
  }

  if (action.id === 'handPicked') {
    return `A different ${action.minutes}-minute reset each day, ordered to lift your ${growthArea.label.toLowerCase()} first.`;
  }

  const projection = plan.projection;
  return projection
    ? `A short hold every ${when} to track your progress from ${projection.baselineSeconds}s toward ${projection.highSeconds}s.`
    : `A short hold every ${when} to track how your breathing is changing.`;
}

function ActionCard({
  action,
  body,
  onChangeTime,
}: {
  action: PlanAction;
  body: string;
  onChangeTime: (minutesFromMidnight: number) => void;
}) {
  const technique = techniqueName(action.techniqueId);
  const title =
    action.id === 'session'
      ? technique ?? action.title
      : action.id === 'handPicked'
        ? 'Azora’s reset'
        : action.title;
  const displayTime = formatPlanTime(action.minutesFromMidnight);

  const { open, sheet } = useTimePickerSheet({
    value: toClockString(action.minutesFromMidnight),
    onChange: (next) => {
      const minutes = fromClockString(next);
      if (minutes != null) onChangeTime(minutes);
    },
    title: 'Set time',
  });

  return (
    <CardSurface style={styles.actionCard}>
      <View style={styles.actionHeader}>
        <View style={styles.actionHeading}>
          <Text style={styles.actionRole}>{title}</Text>
          <Text style={styles.actionWhen}>
            {planTimeOfDayLabel(action.minutesFromMidnight)}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Change time for ${title}, currently ${displayTime}`}
          onPress={open}
          hitSlop={8}
          style={({ pressed }) => [
            styles.actionTime,
            pressed && styles.actionTimePressed,
          ]}
        >
          <View style={styles.actionPill}>
            <Text style={styles.actionPillText}>{displayTime}</Text>
          </View>
          <Icon name="pencil" size={16} color={colors.primary.blue600} />
        </Pressable>
      </View>
      <Text style={styles.actionBody}>{body}</Text>
      {sheet}
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
  actionCard: {
    backgroundColor: colors.background.elevated,
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
  actionHeading: {
    flexShrink: 1,
    gap: 2,
  },
  actionRole: {
    ...typography.heading.heading2,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 19,
    lineHeight: 26,
    color: colors.primary.blue600,
    flexShrink: 1,
  },
  actionWhen: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  actionTime: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionTimePressed: {
    opacity: 0.6,
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
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 23,
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
