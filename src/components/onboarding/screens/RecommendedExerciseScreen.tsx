import { Text } from '../../common/Text';
import { useMemo } from 'react';
import {
  Animated,
  StyleSheet,
  View,
} from 'react-native';
import PlanNotepad, {
  PlanNotepadRow,
  useNotepadRowAnimations,
} from '../PlanNotepad';
import OnboardingSummaryCard from '../OnboardingSummaryCard';
import MindMapRings from '../MindMapRings';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import AzoAside from '../AzoAside';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import {
  type OnboardingPlan,
} from '../../../lib/onboardingPlan';
import {
  programPlanPreviewRows,
  type ProgramPlanPreviewRow,
} from '../../../features/program/domain/programPlanPreview';
import { programPlanShape, latestProgramPreset } from '../../../features/program/domain/programCatalogue';
import type { DailyPlanActionId } from '../../../services/dailyPlan/dailyPlanScheduleCore';
import {
  type OnboardingPreset,
  planPhaseWeeksLabel,
  planPhasesForPlan,
  type PlanPhase,
} from '../../../lib/onboardingPreset';
import type { MindMapScore } from '../../../lib/onboardingScores';
import type { OnboardingIntent } from '../types';
import OnboardingOptionIcon, {
  type OnboardingOptionIconName,
} from '../OnboardingOptionIcon';

interface RecommendedExerciseScreenProps {
  /**
   * Why the plan is kept short, in their own words — from the reason they gave
   * for putting things off, many steps back. Null when they picked more than
   * one reason or skipped it.
   */
  reasonEcho: string | null;
  plan: OnboardingPlan;
  currentScores: MindMapScore[];
  targetScores: MindMapScore[];
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
  /** What they've already tried, in their words. */
  triedEcho: string | null;
  /** Which lesson subject fits this intent. */
  lessonSubject: string;
  /** The user's chosen intent, for fine-grained row title. */
  intent: OnboardingIntent;
  /** The resolved plan, including any direct onboarding answer that refined it. */
  preset: OnboardingPreset;
}

const LESSON_ROW_BY_SUBJECT: Record<string, string> = {
  sleep: 'Learn a quick sleeping tip',
  body: 'Learn a quick energy tip',
  anger: 'Learn about stress',
  focus: 'Learn a quick focus tip',
  quiet: 'Learn a quick calming tip',
};

const INTENT_LESSON_TITLE: Partial<Record<OnboardingIntent, string>> = {
  calm_fast: 'Learn about your emotions',
  emotional_balance: 'Learn about your emotions',
};

/** Plan-specific lesson framing for routes refined from a primary goal. */
const LESSON_TITLE_BY_PLAN: Partial<Record<OnboardingPreset['id'], string>> = {
  home: 'Learn a small home cleaning tip',
  phone: 'Learn how to interrupt a phone loop',
  recovery: 'Learn a gentle way back into the day',
  selfTrust: 'Learn how to rebuild self-trust',
};

export default function RecommendedExerciseScreen({
  plan,
  currentScores,
  targetScores,
  stepIndex,
  stepCount,
  reasonEcho,
  triedEcho,
  lessonSubject,
  intent,
  preset,
  onContinue,
  onBack,
}: RecommendedExerciseScreenProps) {
  const planId = preset.id;
  // The page is the plan, so the rows are the plan's own: one per hour it will
  // ever use, named the way Home will name them.
  const allExerciseRows = useMemo(
    () => programPlanPreviewRows(planId),
    [planId],
  );
  const exerciseRows = useMemo(
    () => allExerciseRows.filter((row) => row.slot !== 'windDown'),
    [allExerciseRows],
  );
  // The plan's reset exercises, lesson, and check-in each write on in one pass.
  const rowAnims = useNotepadRowAnimations(
    exerciseRows.length + 2,
  );

  const phases = useMemo(() => planPhasesForPlan(planId), [planId]);
  const goalDays = preset.weeks * 7;
  const planWeeks = preset.weeks;
  // What the plan costs today and what it grows to. One number would have to
  // pick a week to be true in, and the whole point of the screen is that the
  // plan is not the same day repeated.
  const published = latestProgramPreset(planId);
  const shape = published == null ? null : programPlanShape(published);
  const planOutcome = published?.outcome ?? null;

  return (
    <OnboardingScreenLayout
      title="Your personalized plan to get your life back on track"
      progress={stepIndex / stepCount}
      onBack={onBack}
      centerCopy
      titleStyle={styles.planTitle}
      footer={
        <OnboardingPrimaryButton
          label="Start today’s step"
          onPress={onContinue}
        />
      }
    >
      <View style={styles.page}>
        <View style={styles.section}>
          <MindMapRings scores={currentScores} targetScores={targetScores} />

        </View>

        {/* The plan's promise, in the plan's own words, and the evidence behind
            it. This is the one thing on the page the user actually chose. */}
        <View style={styles.goalBanner}>
          <Text style={styles.goalBannerOutcome}>
            {planOutcome ?? 'Your plan'}
          </Text>
          <Text style={styles.goalBannerWhen}>
            {`Complete one day at a time for ${goalDays} days.`}
          </Text>
        </View>

        {/* The phases as cards, the same shape the profile's findings and the
            plan's rows use, so the whole arc reads as one document. */}
        <View style={styles.ladder}>
          <Text style={styles.sectionTitle}>How your plan unfolds</Text>
          {phases.map((phase) => (
            <PhaseRung key={phase.name} phase={phase} />
          ))}
        </View>

        {/* What the ladder adds up to: a length and a daily cost. No finish
            date, because the plan advances on days done, not on dates. */}
        <View style={styles.horizon}>
          <Text style={styles.horizonLine}>
            {`The full plan lasts ${planWeeks} weeks.`}
          </Text>
          <Text style={styles.horizonLine}>
            {`Today takes about ${shape?.firstDayMinutes ?? plan.fullDailyMinutes} minutes.`}
          </Text>
        </View>

        <View style={styles.section}>
          <AzoAside
            text={
              triedEcho != null
                ? `You have tried ${triedEcho} before. This plan starts smaller.`
                : `Here is everything you need to do today.`
            }
            variant="heading"
          />

          {/* The notebook shows the day itself: its exercises, lesson, and
              check-in. Personal starter to-dos are created for Home, but are
              not part of this reset overview. */}
          {reasonEcho ? (
            <Text style={styles.because}>
              {`We kept today short because you said ${reasonEcho}.`}
            </Text>
          ) : null}

          <PlanNotepad>
            {exerciseRows.map((row, index) => (
              <ExerciseRow
                key={row.slot}
                row={row}
                anim={rowAnims[index]}
              />
            ))}
            <PlanNotepadRow
              anim={rowAnims[exerciseRows.length]}
              title={
                LESSON_TITLE_BY_PLAN[planId] ??
                INTENT_LESSON_TITLE[intent] ??
                LESSON_ROW_BY_SUBJECT[lessonSubject] ??
                'Learn a quick tip'
              }
              leading={
                <OnboardingOptionIcon
                  name="book"
                  size={GOAL_ICON_SIZE}
                  color={colors.playful.teal.base}
                />
              }
            />
            <PlanNotepadRow
              anim={rowAnims[exerciseRows.length + 1]}
              title="Mood Check-In"
              leading={
                <OnboardingOptionIcon
                  name="emoticon-happy-outline"
                  size={GOAL_ICON_SIZE}
                  color={colors.playful.violet.base}
                />
              }
            />
          </PlanNotepad>

          {/* Two promises: tomorrow is not today, and a missed day costs
              nothing. The second is what keeps a gap from reading as a failure;
              the first is what keeps the list from reading as a reminder. */}
          <Text style={styles.note}>
            Miss a day and the plan picks up where you left off. No
            pressure to catch up.
          </Text>
        </View>

      </View>
    </OnboardingScreenLayout>
  );
}

/**
 * One rung of the ladder: what the phase is, what changes in it, and what you
 * can do by the end of it — plus any dated moment that falls inside it.
 *
 * The reach line is the half a user commits to, so it is set in the reading
 * colour rather than the quiet one the detail takes; a rung whose payoff is
 * grey reads as small print.
 */
function PhaseRung({ phase }: { phase: PlanPhase }) {
  return (
    <OnboardingSummaryCard
      title={phase.name}
      meta={planPhaseWeeksLabel(phase)}
      body={phase.detail}
      footer={<Text style={styles.reach}>{phase.reach}</Text>}
    />
  );
}

/** One line of the page: an exercise, when in the day it sits, and how long. */
function ExerciseRow({
  row,
  anim,
}: {
  row: ProgramPlanPreviewRow;
  anim: Animated.Value;
}) {
  return (
    <PlanNotepadRow
      anim={anim}
      title={row.title}
      meta={`${row.minutes} min`}
      leading={
        <OnboardingOptionIcon
          name={ACTION_ICONS[row.slot].name}
          size={GOAL_ICON_SIZE}
          color={ACTION_ICONS[row.slot].accent}
        />
      }
    />
  );
}

// Matched to the to-do list on Home, so a to-do picked here and the same to-do
// tomorrow are visibly one object rather than two designs of it.
const GOAL_ICON_SIZE = 34;

/**
 * A picture per plan action, each with its own colour like the to-dos below it.
 * Blue would have marked the resets out as the app's rows and the to-dos as the
 * user's, which is the seam the single list exists to remove.
 */
const ACTION_ICONS: Record<
  DailyPlanActionId,
  { name: OnboardingOptionIconName; accent: string }
> = {
  session: { name: 'meditation', accent: colors.playful.teal.base },
  handPicked: { name: 'sparkle', accent: colors.playful.violet.base },
  windDown: { name: 'moon', accent: colors.playful.night.base },
};

const styles = StyleSheet.create({
  // The same words the profile's second list is introduced with, so both
  // closing screens announce a section the same way.
  sectionTitle: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  planTitle: {
    fontSize: 32,
    lineHeight: 39,
    letterSpacing: -0.5,
  },
  page: {
    gap: spacing.xl,
  },
  ladder: {
    gap: spacing.sm,
  },
  goalBanner: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  // The plan's own promise, in the plan's own words. It leads the banner
  // because it is the one thing on this page the user actually chose.
  goalBannerOutcome: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  goalBannerWhen: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
  },
  // The number this rung lands on, which is what the rung is selling.
  // The card's one emphasis: same size and leading as its body text, set
  // semibold in the single accent. The payoff line and a milestone's date both
  // take it, so nothing else on the card needs a style of its own.
  reach: {
    ...typography.body.small,
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.primary.blue500,
    lineHeight: 23,
  },
  horizon: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  horizonLine: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    color: colors.text.secondary,
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
    color: colors.primary.blue500,
  },
  section: {
    gap: spacing.md,
  },
  // The one line on this page that cites an answer rather than a score.
  because: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  note: {
    ...typography.body.small,
    textAlign: 'center',
    color: colors.text.secondary,
    lineHeight: 20,
  },
});
