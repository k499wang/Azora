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
  fromClockString,
  planTimeOfDayLabel,
  toClockString,
  type PlanAction,
  type PlanActionId,
  type OnboardingPlan,
} from '../../../lib/onboardingPlan';
import type { MindMapScore } from '../../../lib/onboardingScores';
import type { StarterPlanItem } from '../../../lib/onboardingStarterPlan';
import OnboardingOptionIcon, {
  type OnboardingOptionIconName,
} from '../OnboardingOptionIcon';
import { ONBOARDING_VISUAL_MAX_WIDTH } from '../onboardingVisualScale';

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
  ruled,
  anim,
}: {
  item: StarterPlanItem;
  ruled: boolean;
  anim: Animated.Value;
}) {
  return (
    <PlanNotepadRow
      anim={anim}
      ruled={ruled}
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
  plan,
  currentScores,
  targetScores,
  growthArea,
  stepIndex,
  stepCount,
  onChangeActionTime,
  starterPlan,
  onContinue,
  onBack,
}: RecommendedExerciseScreenProps) {
  const { width } = useWindowDimensions();
  // One run of values for the whole page, so the resets and the to-dos are
  // written on in a single pass rather than two lists racing each other.
  const rowAnims = useNotepadRowAnimations(
    plan.actions.length + starterPlan.length,
  );

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

        <View style={styles.section}>
          <MochiAside
            text="We made this plan for you:"
            variant="heading"
            expression="pleased"
          />

          {/* One unbroken list: a reset and a to-do are two lines of the same
              day, and heading them separately made the page read as two lists
              that happened to share paper. */}
          <PlanNotepad>
            {plan.actions.map((action, index) => (
              <ActionRow
                key={action.id}
                action={action}
                ruled={index > 0}
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
                ruled
                anim={rowAnims[plan.actions.length + index]}
              />
            ))}
          </PlanNotepad>

        </View>

      </View>
    </OnboardingScreenLayout>
  );
}

function ActionRow({
  action,
  ruled,
  anim,
  onChangeTime,
}: {
  action: PlanAction;
  ruled: boolean;
  anim: Animated.Value;
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
    <>
      <PlanNotepadRow
        anim={anim}
        ruled={ruled}
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
    fontWeight: '500',
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
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    color: colors.playful.amber.ink,
  },
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
