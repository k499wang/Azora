import { Text } from '../../common/Text';
import { useMemo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import PlanNotepad, { PlanNotepadRow, useNotepadRowAnimations } from '../PlanNotepad';
import PlanJourney, { type PlanJourneyStop } from '../PlanJourney';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import AzoAside from '../AzoAside';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import {
  programPlanPreviewRows,
  type ProgramPlanPreviewRow,
} from '../../../features/program/domain/programPlanPreview';
import type { DailyPlanActionId } from '../../../services/dailyPlan/dailyPlanScheduleCore';
import {
  type OnboardingPreset,
  planFinishLine,
  planJourney,
} from '../../../lib/onboardingPreset';
import type { OnboardingIntent } from '../types';
import OnboardingOptionIcon, { type OnboardingOptionIconName } from '../OnboardingOptionIcon';

interface PlanDaysScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
  /**
   * Why the plan is kept short, in their own words — from the reason they gave
   * for putting things off, many steps back. Null when they picked more than
   * one reason or skipped it.
   */
  reasonEcho: string | null;
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

/** How the plan gets there: the road through its days, then today itself. */
export default function PlanDaysScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
  reasonEcho,
  triedEcho,
  lessonSubject,
  intent,
  preset,
}: PlanDaysScreenProps) {
  const planId = preset.id;
  // The page is the plan, so the rows are the plan's own: one per hour it will
  // ever use, named the way Home will name them.
  const allExerciseRows = useMemo(() => programPlanPreviewRows(planId), [planId]);
  const exerciseRows = useMemo(
    () => allExerciseRows.filter((row) => row.slot !== 'windDown'),
    [allExerciseRows],
  );
  // The plan's reset exercises, lesson, and check-in each write on in one pass.
  const rowAnims = useNotepadRowAnimations(exerciseRows.length + 2);

  const journey = useMemo<PlanJourneyStop[]>(
    () =>
      planJourney(planId).map((stop, index) => ({
        ...stop,
        ...JOURNEY_MARKS[index % JOURNEY_MARKS.length],
      })),
    [planId],
  );
  // The day the plan lands, the way the paywall will repeat it.
  const finishLine = useMemo(() => planFinishLine(preset, new Date()), [preset]);

  return (
    <OnboardingScreenLayout
      title={`Here's what your next ${preset.weeks * DAYS_PER_WEEK} days look like`}
      subtitle="One tiny step a day. Not a total life overhaul."
      progress={stepIndex / stepCount}
      onBack={onBack}
      centerCopy
      footer={<OnboardingPrimaryButton label="Start today’s step" onPress={onContinue} />}
    >
      <View style={styles.page}>
        <Text style={styles.finishLine}>{finishLine}</Text>

        <PlanJourney stops={journey} />

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
              <ExerciseRow key={row.slot} row={row} anim={rowAnims[index]} />
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
            Miss a day and the plan picks up where you left off. No pressure to
            catch up.
          </Text>
        </View>
      </View>
    </OnboardingScreenLayout>
  );
}

/** One line of the page: an exercise, when in the day it sits, and how long. */
function ExerciseRow({ row, anim }: { row: ProgramPlanPreviewRow; anim: Animated.Value }) {
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

const DAYS_PER_WEEK = 7;

/** A picture per stop, in order along the journey. */
const JOURNEY_MARKS: readonly Pick<PlanJourneyStop, 'icon' | 'accent'>[] = [
  { icon: 'walk', accent: colors.playful.teal.base },
  { icon: 'breath-leaf', accent: colors.playful.sky.base },
  { icon: 'streak', accent: colors.playful.coral.base },
  { icon: 'calendar-check-outline', accent: colors.playful.violet.base },
  { icon: 'target', accent: colors.playful.amber.base },
  { icon: 'star', accent: colors.playful.teal.base },
];

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
  page: {
    gap: spacing.xl,
  },
  finishLine: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
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
