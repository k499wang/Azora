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
import { latestProgramPreset } from '../../../features/program/domain/programCatalogue';
import { PLAN_TODO_STEP_ENABLED } from '../../../features/program/domain/programTodoStep';
import { lessonForDay, lessonRowTitle } from '../../../features/lessons/domain/lessonCatalogue';
import { pressureLessonTrackForIntent } from '../../../features/lessons/domain/pressureLessonTrack';
import type { DailyPlanActionId } from '../../../services/dailyPlan/dailyPlanScheduleCore';
import {
  type OnboardingPreset,
  planFinishLine,
  planJourney,
} from '../../../lib/onboardingPreset';
import { ARCHETYPE_FOR_PLAN } from '../../../lib/onboardingArchetype';
import type { OnboardingIntent } from '../types';
import OnboardingOptionIcon, { type OnboardingOptionIconName } from '../OnboardingOptionIcon';

interface PlanDaysScreenProps {
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
  stress: 'Learn a small step for stressful days',
  worry: 'Learn a small step for repeated worries',
  anger: 'Learn to pause before you react',
  focus: 'Learn a quick focus tip',
  quiet: 'Learn a quick calming tip',
};

/** How the plan gets there: the road through its days, then today itself. */
export default function PlanDaysScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
  triedEcho,
  lessonSubject,
  intent,
  preset,
}: PlanDaysScreenProps) {
  const planId = preset.id;
  const openingLesson = lessonForDay(
    planId,
    1,
    latestProgramPreset(planId)?.revision,
    pressureLessonTrackForIntent(intent),
  );
  // The page is the plan, so the rows are the plan's own: one per hour it will
  // ever use, named the way Home will name them.
  const allExerciseRows = useMemo(() => programPlanPreviewRows(planId), [planId]);
  const exerciseRows = useMemo(
    () => allExerciseRows.filter((row) => row.slot !== 'windDown'),
    [allExerciseRows],
  );
  // The plan's exercises, lesson, check-in and to-do each write on in one pass.
  const rowAnims = useNotepadRowAnimations(exerciseRows.length + 2 + (PLAN_TODO_STEP_ENABLED ? 1 : 0));

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
      title={`We recommend Azora's ${ARCHETYPE_FOR_PLAN[planId].planName} plan for you`}
      subtitle="One tiny step a day. Not a total life overhaul."
      progress={stepIndex / stepCount}
      onBack={onBack}
      centerCopy
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
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

          <PlanNotepad>
            {exerciseRows.map((row, index) => (
              <ExerciseRow key={row.slot} row={row} anim={rowAnims[index]} />
            ))}
            <PlanNotepadRow
              anim={rowAnims[exerciseRows.length]}
              title={
                (openingLesson != null ? lessonRowTitle(openingLesson.id) : null) ??
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
            {PLAN_TODO_STEP_ENABLED && <PlanNotepadRow
              anim={rowAnims[exerciseRows.length + 2]}
              title="Do a to-do"
              leading={
                <OnboardingOptionIcon
                  name="checkbox-marked-circle-outline"
                  size={GOAL_ICON_SIZE}
                  color={colors.playful.amber.base}
                />
              }
            />}
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
  note: {
    ...typography.body.small,
    textAlign: 'center',
    color: colors.text.secondary,
    lineHeight: 20,
  },
});
