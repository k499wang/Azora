import { Text } from '../../common/Text';
import { useEffect, useMemo } from 'react';
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
import { PLAN_TODO_STEP_ENABLED } from '../../../features/program/domain/programTodoStep';
import type { DailyPlanActionId } from '../../../services/dailyPlan/dailyPlanScheduleCore';
import {
  type OnboardingPreset,
  planFinishLine,
} from '../../../lib/onboardingPreset';
import { ARCHETYPE_FOR_PLAN } from '../../../lib/onboardingArchetype';
import { personalizedPlanJourney } from '../../../lib/onboardingPlanJourney';
import type { OnboardingTodayPreview } from '../../../lib/onboardingTodayPreview';
import { trackOnboardingPlanPreviewViewed } from '../../../services/analytics/onboarding';
import type { OnboardingIntent } from '../types';
import OnboardingOptionIcon, { type OnboardingOptionIconName } from '../OnboardingOptionIcon';

interface PlanDaysScreenProps {
  /** Lab previews do not count as onboarding exposure. */
  trackExposure?: boolean;
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
  preview: OnboardingTodayPreview;
  /** The user's chosen intent, for fine-grained row title. */
  intent: OnboardingIntent;
  /** The resolved plan, including any direct onboarding answer that refined it. */
  preset: OnboardingPreset;
  name: string | null;
  goalPhrase: string | null;
}

const LESSON_TIP_TITLE: Record<OnboardingPreset['id'], string> = {
  home: 'Learn a quick tidying tip',
  night: 'Learn a quick sleep tip',
  morning: 'Learn a quick energy tip',
  pressure: 'Learn a quick stress tip',
  focus: 'Learn a quick focus tip',
  quiet: 'Learn a quick mindfulness tip',
  phone: 'Learn a quick tip for less scrolling',
  recovery: 'Learn a quick self-care tip',
  selfTrust: 'Learn a quick habit tip',
};

/** How the plan gets there: the road through its days, then today itself. */
export default function PlanDaysScreen({
  trackExposure = true,
  stepIndex,
  stepCount,
  onContinue,
  onBack,
  preview,
  intent,
  preset,
  name,
  goalPhrase,
}: PlanDaysScreenProps) {
  const planId = preset.id;
  const lessonTipTitle = planId === 'pressure' && intent === 'calm_fast'
    ? 'Learn a quick tip for overthinking'
    : planId === 'pressure' && intent === 'emotional_balance'
      ? 'Learn a quick tip for handling anger'
      : LESSON_TIP_TITLE[planId];
  const lessonId = preview.lesson.id;
  const firstResetDay = preview.firstResetDay;
  useEffect(() => {
    if (!trackExposure) return;
    trackOnboardingPlanPreviewViewed({
      preset_id: planId,
      preset_revision: preset.revision ?? null,
      primary_intent: intent,
      lesson_id: lessonId,
      first_reset_day: firstResetDay,
    });
  }, [trackExposure, planId, preset.revision, intent, lessonId, firstResetDay]);
  // The page is the plan, so the rows are the plan's own: one per hour it will
  // ever use, named the way Home will name them.
  const allExerciseRows = useMemo(() => programPlanPreviewRows(planId), [planId]);
  const exerciseRows = useMemo(
    () => allExerciseRows.filter((row) => row.slot !== 'windDown'),
    [allExerciseRows],
  );
  // The practical action belongs to the lesson, rather than a separate Reset.
  const rowAnims = useNotepadRowAnimations(exerciseRows.length + 3 + (PLAN_TODO_STEP_ENABLED ? 1 : 0));

  const journey = useMemo<PlanJourneyStop[]>(
    () => personalizedPlanJourney(preset, intent, name, goalPhrase).stops.map((stop, index) => ({
      ...stop,
      ...JOURNEY_MARKS[index % JOURNEY_MARKS.length],
    })),
    [preset, intent, name, goalPhrase],
  );
  // The day the plan lands, the way the paywall will repeat it.
  const finishLine = useMemo(() => planFinishLine(preset, new Date()), [preset]);

  return (
    <OnboardingScreenLayout
      title={`We recommend Azora's ${ARCHETYPE_FOR_PLAN[planId].planName} plan for you`}
      subtitle="One tiny step a day."
      progress={stepIndex / stepCount}
      onBack={onBack}
      centerCopy
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={styles.page}>
        <Text style={styles.finishLine}>{finishLine}</Text>

        <PlanJourney stops={journey} />

        <View style={styles.section}>
          <AzoAside text="Here’s everything you need to do today" variant="heading" />
          <Text style={styles.reason}>{preview.reason}</Text>

          <PlanNotepad>
            {exerciseRows.map((row, index) => (
              <ExerciseRow key={row.slot} row={row} anim={rowAnims[index]} />
            ))}
            <PlanNotepadRow
              anim={rowAnims[exerciseRows.length]}
              title={lessonTipTitle}
              meta={preview.lesson.introduction}
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
              title="Try it"
              meta={preview.lesson.step}
              leading={
                <OnboardingOptionIcon
                  name="target"
                  size={GOAL_ICON_SIZE}
                  color={colors.playful.coral.base}
                />
              }
            />
            <PlanNotepadRow
              anim={rowAnims[exerciseRows.length + 2]}
              title="Mood Check-In"
              meta="About 1 min · Record how you’re feeling."
              leading={
                <OnboardingOptionIcon
                  name="emoticon-happy-outline"
                  size={GOAL_ICON_SIZE}
                  color={colors.playful.violet.base}
                />
              }
            />
            {PLAN_TODO_STEP_ENABLED && <PlanNotepadRow
              anim={rowAnims[exerciseRows.length + 3]}
              title="Finish a habit"
              meta="Tick off one of your chosen to-dos."
              leading={
                <OnboardingOptionIcon
                  name="checkbox-marked-circle-outline"
                  size={GOAL_ICON_SIZE}
                  color={colors.playful.amber.base}
                />
              }
            />}
          </PlanNotepad>

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
  reason: {
    ...typography.body.small,
    textAlign: 'center',
    color: colors.text.primary,
    lineHeight: 20,
  },
  note: {
    ...typography.body.small,
    textAlign: 'center',
    color: colors.text.secondary,
    lineHeight: 20,
  },
});
