import { Text } from '../../common/Text';
import { useMemo } from 'react';
import {
  Animated,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import PlanNotepad, {
  PlanNotepadRow,
  useNotepadRowAnimations,
} from '../PlanNotepad';
import Icon from '../../common/icons/Icon';
import OnboardingSummaryCard from '../OnboardingSummaryCard';
import MindMapRadar from '../MindMapRadar';
import { useTimePickerSheet } from '../../common/useTimePickerSheet';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import AzoAside from '../AzoAside';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import {
  formatPlanTime,
  fromClockString,
  planTimeOfDayLabel,
  toClockString,
  type OnboardingPlan,
} from '../../../lib/onboardingPlan';
import {
  programPlanPreviewRows,
  type ProgramPlanPreviewRow,
} from '../../../features/program/domain/programPlanPreview';
import { programPlanShape, latestProgramPreset } from '../../../features/program/domain/programCatalogue';
import type { DailyPlanActionId } from '../../../services/dailyPlan/dailyPlanScheduleCore';
import {
  onboardingPresetFor,
  planGoalDays,
  planPhaseWeeksLabel,
  planProofLine,
  planPhases,
  type PlanPhase,
} from '../../../lib/onboardingPreset';
import type { MindMapScore } from '../../../lib/onboardingScores';
import type { StarterPlanItem } from '../../../lib/onboardingStarterPlan';
import OnboardingOptionIcon, {
  type OnboardingOptionIconName,
} from '../OnboardingOptionIcon';
import { ONBOARDING_VISUAL_MAX_WIDTH } from '../onboardingVisualScale';

interface RecommendedExerciseScreenProps {
  /**
   * Why the plan is kept short, in their own words — from the reason they gave
   * for putting things off, many steps back. Null when they picked more than
   * one reason or skipped it.
   */
  reasonEcho: string | null;
  /**
   * What the plan was built around, in their own terms — the line that ties the
   * plan's territory back to the goals they picked. Null when they named
   * nothing specific.
   */
  goalsLine: string | null;
  plan: OnboardingPlan;
  currentScores: MindMapScore[];
  targetScores: MindMapScore[];
  growthArea: MindMapScore;
  stepIndex: number;
  stepCount: number;
  /** The hour each of the plan's slots sits at, minutes from midnight. */
  slotTimes: Record<DailyPlanActionId, number>;
  onChangeSlotTime: (
    slot: DailyPlanActionId,
    minutesFromMidnight: number,
  ) => void;
  starterPlan: StarterPlanItem[];
  onContinue: () => void;
  onBack: () => void;
  /** Their stress level described in their own words. */
  stressDescription: string | null;
  /** Their brain fog described in their own words. */
  fogDescription: string | null;
  /** What keeps them up at night, in their words. */
  sleepCauseEcho: string | null;
  /** How long they sleep, in their words. */
  sleepDurationEcho: string | null;
  /** How getting out of bed goes, in their words. */
  wakeEaseEcho: string | null;
  /** How active their days are, in their words. */
  dayActivityEcho: string | null;
  /** How they feel about their routine, in their words. */
  routineEcho: string | null;
  /** What they've already tried, in their words. */
  triedEcho: string | null;
  /** What's at stake for them, in their words. */
  stakesEcho: string | null;
}

/**
 * A to-do the plan starts the user on, written the same way a reset is: the
 * only difference is that its hour is fixed here and changed later on Home.
 */
function StarterPlanRow({
  item,
  anim,
}: {
  item: StarterPlanItem;
  anim: Animated.Value;
}) {
  return (
    <PlanNotepadRow
      anim={anim}
      title={item.title}
      leading={
        <OnboardingOptionIcon
          name={item.icon}
          size={GOAL_ICON_SIZE}
          color={item.accent}
        />
      }
    />
  );
}

export default function RecommendedExerciseScreen({
  goalsLine,
  plan,
  currentScores,
  targetScores,
  growthArea,
  stepIndex,
  stepCount,
  slotTimes,
  onChangeSlotTime,
  starterPlan,
  reasonEcho,
  stressDescription,
  fogDescription,
  sleepCauseEcho,
  sleepDurationEcho,
  wakeEaseEcho,
  dayActivityEcho,
  routineEcho,
  triedEcho,
  stakesEcho,
  onContinue,
  onBack,
}: RecommendedExerciseScreenProps) {
  const { width } = useWindowDimensions();
  const planId = onboardingPresetFor(plan.intent).id;
  // The page is the plan, so the rows are the plan's own: one per hour it will
  // ever use, named the way Home will name them.
  const exerciseRows = useMemo(
    () => programPlanPreviewRows(planId, plan.intent),
    [planId, plan.intent],
  );
  // One run of values for the whole page, so the resets and the to-dos are
  // written on in a single pass rather than two lists racing each other.
  const rowAnims = useNotepadRowAnimations(
    exerciseRows.length + starterPlan.length,
  );

  const phases = useMemo(() => planPhases(plan.intent), [plan.intent]);
  const goalDays = planGoalDays(plan.intent);
  // Title and subtitle carry the recommendation, the way every other screen in
  // the flow states its one thing, rather than a stack of centred lines.
  //
  // The plan's own name is deliberately absent: the title already says what
  // this is, and naming the programme here made the line read as a product
  // being handed over rather than as their plan.
  //
  // `goalsLine` arrives as `built around sleep and focus`, lower-case so it can
  // follow a clause. Here it is the whole sentence.
  const subtitle =
    goalsLine == null ? undefined : (
      <Text style={styles.planNameEmphasis}>
        {`For ${goalsLine.slice('built around '.length)}.`}
      </Text>
    );

  const planWeeks = onboardingPresetFor(plan.intent).weeks;
  // What the plan costs today and what it grows to. One number would have to
  // pick a week to be true in, and the whole point of the screen is that the
  // plan is not the same day repeated.
  const published = latestProgramPreset(planId);
  const shape = published == null ? null : programPlanShape(published);
  const planOutcome = published?.outcome ?? null;

  return (
    <OnboardingScreenLayout
      title="Your personalized plan"
      subtitle={subtitle}
      progress={stepIndex / stepCount}
      onBack={onBack}
      centerCopy
      titleStyle={styles.planTitle}
      footer={
        <OnboardingPrimaryButton
          label="Start my plan"
          onPress={onContinue}
        />
      }
    >
      <View style={styles.page}>
        <View style={styles.section}>
          <View style={styles.radarWrap}>
            <MindMapRadar
              scores={currentScores}
              targetScores={targetScores}
              labelScores={currentScores}
              size={Math.min(width, ONBOARDING_VISUAL_MAX_WIDTH)}
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

          {/* The scores, said as scores. This screen used to name the lowest
              axis and claim the plan focused on it, which the plan does not
              choose from. */}
          <Text style={styles.note}>
            {stressDescription != null
              ? `From what you told us, ${stressDescription.charAt(0).toUpperCase()}${stressDescription.slice(1)}. ${growthArea.label} has the most room to grow, so the plan focuses there first.`
              : fogDescription != null
                ? `From what you told us, ${fogDescription.charAt(0).toUpperCase()}${fogDescription.slice(1)}. ${growthArea.label} has the most room to grow, so the plan focuses there first.`
                : `Your scores today, from what you told us. ${growthArea.label} has the most room to grow.`}
          </Text>
        </View>

        {/* The plan's promise, in the plan's own words, and the evidence behind
            it. This is the one thing on the page the user actually chose. */}
        <View style={styles.goalBanner}>
          <Text style={styles.goalBannerOutcome}>
            {planOutcome ?? 'Your plan'}
          </Text>
          <Text style={styles.goalBannerWhen}>
            {`over ${goalDays} finished days`}
          </Text>
          {stakesEcho != null ? (
            <Text style={styles.goalBannerProof}>
              {`Because you said it matters for ${stakesEcho}.`}
            </Text>
          ) : (
            <Text style={styles.goalBannerProof}>
              {planProofLine(plan.intent)}
            </Text>
          )}
        </View>

        {/* The phases as cards, the same shape the profile's findings and the
            plan's rows use, so the whole arc reads as one document. */}
        <View style={styles.ladder}>
          {phases.map((phase) => (
            <PhaseRung key={phase.name} phase={phase} />
          ))}
        </View>

        {/* What the ladder adds up to: a length and a daily cost. No finish
            date, because the plan advances on days done, not on dates. */}
        <View style={styles.horizon}>
          <Text style={styles.horizonLine}>
            {goalsLine == null
              ? `Your ${planWeeks}-week plan`
              : `Your ${planWeeks}-week plan, ${goalsLine}`}
          </Text>
          <Text style={styles.horizonLine}>
            {`${shape?.firstDayMinutes ?? plan.fullDailyMinutes} minutes a day`}
          </Text>
        </View>

        <View style={styles.section}>
          <AzoAside
            text={
              triedEcho != null
                ? `You've tried ${triedEcho} before. This builds on that.`
                : `Here's what your day looks like!`
            }
            variant="heading"
          />

          {/* One unbroken list: a reset and a to-do are two lines of the same
              day, and heading them separately made the page read as two lists
              that happened to share paper. */}
          {reasonEcho ? (
            <Text style={styles.because}>
              {`Short on purpose, since you said ${reasonEcho}.`}
            </Text>
          ) : null}

          <PlanNotepad>
            {exerciseRows.map((row, index) => (
              <ExerciseRow
                key={row.slot}
                row={row}
                minutesFromMidnight={slotTimes[row.slot]}
                anim={rowAnims[index]}
                onChangeTime={(minutes) => onChangeSlotTime(row.slot, minutes)}
              />
            ))}
            {starterPlan.map((item, index) => (
              <StarterPlanRow
                key={item.id}
                item={item}
                anim={rowAnims[exerciseRows.length + index]}
              />
            ))}
          </PlanNotepad>

          {sleepDurationEcho != null ? (
            <Text style={styles.because}>
              {`Since you usually sleep ${sleepDurationEcho}, the wind-down matters.`}
            </Text>
          ) : null}

          {wakeEaseEcho != null && (wakeEaseEcho === 'hit snooze more than once' || wakeEaseEcho === 'find getting up a real fight') ? (
            <Text style={styles.because}>
              {`The morning reset is there to help with getting up.`}
            </Text>
          ) : null}

          {sleepCauseEcho != null ? (
            <Text style={styles.because}>
              {`The wind-down is there because you said ${sleepCauseEcho}.`}
            </Text>
          ) : null}

          {dayActivityEcho != null ? (
            <Text style={styles.because}>
              {`The short moves are there because you said ${dayActivityEcho}.`}
            </Text>
          ) : null}

          {routineEcho != null && routineEcho !== 'your routine is working for you' ? (
            <Text style={styles.because}>
              {`The to-dos are there because you said ${routineEcho}.`}
            </Text>
          ) : null}

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
  minutesFromMidnight,
  anim,
  onChangeTime,
}: {
  row: ProgramPlanPreviewRow;
  minutesFromMidnight: number;
  anim: Animated.Value;
  onChangeTime: (minutesFromMidnight: number) => void;
}) {
  const displayTime = formatPlanTime(minutesFromMidnight);
  const meta = `${planTimeOfDayLabel(minutesFromMidnight)} \u00b7 ${row.minutes} min`;

  const { open, sheet } = useTimePickerSheet({
    value: toClockString(minutesFromMidnight),
    onChange: (next) => {
      const minutes = fromClockString(next);
      if (minutes != null) onChangeTime(minutes);
    },
    title: 'Set time',
  });

  return (
    <>
      <PlanNotepadRow
        anim={anim}
        title={row.title}
        meta={meta}
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={`Change time for ${row.title}, currently ${displayTime}`}
        leading={
          <OnboardingOptionIcon
            name={ACTION_ICONS[row.slot].name}
            size={GOAL_ICON_SIZE}
            color={ACTION_ICONS[row.slot].accent}
          />
        }
        trailing={
          <View style={styles.token}>
            <Text style={styles.tokenText}>{displayTime}</Text>
            <Icon
              name="pencil"
              size={13}
              color={colors.playful.amber.ink}
            />
          </View>
        }
      />
      {sheet}
    </>
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
/** the height every row's right-hand token shares */
const TOKEN_HEIGHT = 28;

const styles = StyleSheet.create({
  // The same words the profile's second list is introduced with, so both
  // closing screens announce a section the same way.
  sectionTitle: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  // Both kinds of row end in one of these, at one weight: the page has a single
  // accent and the right-hand column stops looking ragged.
  token: {
    height: TOKEN_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    justifyContent: 'center',
    borderRadius: TOKEN_HEIGHT / 2,
    paddingHorizontal: spacing.sm + spacing.xs,
    backgroundColor: colors.playful.amber.soft,
  },
  tokenText: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontVariant: ['tabular-nums'],
    color: colors.playful.amber.ink,
  },
  // The plan's own name, wherever it is said inside one of the app's sentences.
  planNameEmphasis: {
    fontFamily: fonts.semibold,
    color: colors.primary.blue500,
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
  // The evidence, quiet and once: it backs the projection above it rather than
  // competing with it.
  goalBannerProof: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 18,
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
    color: colors.text.secondary,
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
