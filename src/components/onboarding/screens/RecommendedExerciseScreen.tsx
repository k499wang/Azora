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
import TECHNIQUES from '../../../features/exercise/guidedBreathing/techniques';
import {
  formatPlanTime,
  fromClockString,
  planTimeOfDayLabel,
  toClockString,
  type PlanAction,
  type PlanActionId,
  type OnboardingPlan,
} from '../../../lib/onboardingPlan';
import {
  onboardingPresetFor,
  planNameFor,
  planGoalDate,
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
  onChangeActionTime: (
    actionId: PlanActionId,
    minutesFromMidnight: number,
  ) => void;
  starterPlan: StarterPlanItem[];
  onContinue: () => void;
  onBack: () => void;
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

function techniqueName(techniqueId: string | null): string | null {
  if (!techniqueId) return null;
  return TECHNIQUES.find((t) => t.id === techniqueId)?.name ?? null;
}

export default function RecommendedExerciseScreen({
  goalsLine,
  plan,
  currentScores,
  targetScores,
  growthArea,
  stepIndex,
  stepCount,
  onChangeActionTime,
  starterPlan,
  reasonEcho,
  onContinue,
  onBack,
}: RecommendedExerciseScreenProps) {
  const { width } = useWindowDimensions();
  // One run of values for the whole page, so the resets and the to-dos are
  // written on in a single pass rather than two lists racing each other.
  const rowAnims = useNotepadRowAnimations(
    plan.actions.length + starterPlan.length,
  );

  // The first rung is written in the numbers they just chose — their session
  // length, at the hour it sits on the plan below — so the ladder starts from
  // where they actually are rather than from a general Week 1.
  const session = plan.actions.find((action) => action.id === 'session');
  const targetScore = useMemo(
    () =>
      targetScores.find((score) => score.axis === growthArea.axis)?.value ??
      growthArea.value,
    [targetScores, growthArea],
  );
  // Day one is today for everyone who finishes onboarding, so the whole ladder
  // can be dated: a rung that says "8 Oct" is something to hold yourself to in
  // a way that "Week 3" never is.
  const startDate = useMemo(() => new Date(), []);
  const phases = useMemo(
    () =>
      planPhases(plan.intent, {
        startMinutes: session?.minutes ?? plan.fullDailyMinutes,
        startTime:
          session == null
            ? null
            : formatPlanTime(session.minutesFromMidnight),
        startDate,
        resetCount: plan.actions.length,
        fullMinutes: plan.fullDailyMinutes,
      }),
    [plan.intent, plan.fullDailyMinutes, plan.actions.length, session, startDate],
  );
  const goalDate = planGoalDate(plan.intent, startDate);
  const planName = planNameFor(plan.intent);
  // Title and subtitle carry the recommendation, the way every other screen in
  // the flow states its one thing, rather than a stack of centred lines.
  const subtitle = (
    <>
      We recommend the <Text style={styles.planNameEmphasis}>{planName}</Text>{' '}
      plan for you{goalsLine == null ? '' : `, ${goalsLine}`}.
    </>
  );

  const planWeeks = onboardingPresetFor(plan.intent).weeks;

  const biggestLift = useMemo(() => {
    const growthTarget = targetScores.find(
      (score) => score.axis === growthArea.axis,
    );
    return growthTarget ? growthTarget.value - growthArea.value : null;
  }, [targetScores, growthArea]);
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

          <Text style={styles.note}>
            {biggestLift != null
              ? `${growthArea.label} climbs the most, about ${biggestLift} points, because your daily actions are chosen to lift it first.`
              : `${growthArea.label} has the most room to move, so your daily actions are chosen to lift it first.`}
          </Text>
        </View>

        {/* The promise the ladder is a breakdown of: where they are, where the
            plan puts them, and the date it happens on. */}
        <View style={styles.goalBanner}>
          <Text style={styles.goalBannerLabel}>{growthArea.label}</Text>
          <View style={styles.goalBannerNumbers}>
            <Text style={styles.goalFrom}>{growthArea.value}</Text>
            <Icon
              name="arrow-right"
              size={18}
              color={colors.text.tertiary}
            />
            <Text style={styles.goalTo}>{targetScore}</Text>
          </View>
          <Text style={styles.goalBannerDate}>by {goalDate}</Text>
          <Text style={styles.goalBannerProof}>
            {planProofLine(plan.intent)}
          </Text>
        </View>

        {/* The phases as cards, the same shape the profile's findings and the
            plan's rows use, so the whole arc reads as one document. */}
        <View style={styles.ladder}>
          {phases.map((phase) => (
            <PhaseRung key={phase.name} phase={phase} />
          ))}
        </View>

        {/* What the ladder adds up to: a length, a target and a daily cost. No
            finish date — the plan advances on days done, not on dates. */}
        <View style={styles.horizon}>
          <Text style={styles.horizonLine}>
            Your {planWeeks}-week plan to improve {growthArea.label}
          </Text>
          <Text style={styles.horizonLine}>
            {plan.fullDailyMinutes} minutes a day
          </Text>
        </View>

        <View style={styles.section}>
          <AzoAside
            text={`Here's what a day of ${planName} looks like!`}
            variant="heading"
          />

          {/* One unbroken list: a reset and a to-do are two lines of the same
              day, and heading them separately made the page read as two lists
              that happened to share paper. */}
          {reasonEcho ? (
            <Text style={styles.because}>
              Kept short, since {reasonEcho}.
            </Text>
          ) : null}

          <PlanNotepad>
            {plan.actions.map((action, index) => (
              <ActionRow
                key={action.id}
                action={action}
                anim={rowAnims[index]}
                onChangeTime={(minutes) =>
                  onChangeActionTime(action.id, minutes)
                }
              />
            ))}
            {starterPlan.map((item, index) => (
              <StarterPlanRow
                key={item.id}
                item={item}
                anim={rowAnims[plan.actions.length + index]}
              />
            ))}
          </PlanNotepad>

          {/* The plan advances on days done, not on dates, and saying so is
              what keeps a missed day from reading as a failed one. */}
          <Text style={styles.note}>
            Miss a day and the plan waits. It doesn’t move without you.
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
      meta={`${planPhaseWeeksLabel(phase)} \u00b7 ${phase.dateRange}`}
      body={phase.detail}
      footer={<Text style={styles.reach}>{phase.reach}</Text>}
    />
  );
}

function ActionRow({
  action,
  anim,
  onChangeTime,
}: {
  action: PlanAction;
  anim: Animated.Value;
  onChangeTime: (minutesFromMidnight: number) => void;
}) {
  const technique = techniqueName(action.techniqueId);
  const title =
    action.id === 'session'
      ? technique ?? action.title
      : action.id === 'handPicked'
        ? HAND_PICKED_TITLE
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
    <>
      <PlanNotepadRow
        anim={anim}
        title={title}
        meta={planTimeOfDayLabel(action.minutesFromMidnight)}
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={`Change time for ${title}, currently ${displayTime}`}
        leading={
          <OnboardingOptionIcon
            name={ACTION_ICONS[action.id].name}
            size={GOAL_ICON_SIZE}
            color={ACTION_ICONS[action.id].accent}
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

/** What the plan list calls the complementary reset, and so must the ladder. */
const HAND_PICKED_TITLE = 'Azora’s reset';

// Matched to the to-do list on Home, so a to-do picked here and the same to-do
// tomorrow are visibly one object rather than two designs of it.
const GOAL_ICON_SIZE = 34;

/**
 * A picture per plan action, each with its own colour like the to-dos below it.
 * Blue would have marked the resets out as the app's rows and the to-dos as the
 * user's, which is the seam the single list exists to remove.
 */
const ACTION_ICONS: Record<
  PlanActionId,
  { name: OnboardingOptionIconName; accent: string }
> = {
  session: { name: 'meditation', accent: colors.playful.teal.base },
  handPicked: { name: 'sparkle', accent: colors.playful.violet.base },
  checkIn: { name: 'heart-pulse', accent: colors.playful.coral.base },
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
  goalBannerLabel: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
  },
  goalBannerNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  goalFrom: {
    ...typography.stat.value,
    fontFamily: fonts.semibold,
    fontVariant: ['tabular-nums'],
    color: colors.text.tertiary,
  },
  goalTo: {
    ...typography.stat.value,
    fontFamily: fonts.semibold,
    fontVariant: ['tabular-nums'],
    color: colors.orange[500],
  },
  goalBannerDate: {
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
