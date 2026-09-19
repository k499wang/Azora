/**
 * The door into a plan, for an account that never got one.
 *
 * Plans are started at the onboarding seal, so everybody who finished
 * onboarding before they existed lands on this tab with nothing on it. This is
 * the whole fix: their own goal, already resolved into a plan, and one button.
 *
 * An empty state rather than a card. A card is a thing among other things, and
 * there is nothing else on this screen — one card floating under a large title
 * reads as the first of a list that failed to load. Bare on the canvas and
 * centred, it reads as the screen itself, which is what it is.
 *
 * Opt-in, never automatic. Starting a plan changes what Home asks of them
 * every morning, and an app that rearranges somebody's daily list overnight
 * without being asked is the thing users organise one-star campaigns about.
 * So it says what will change *before* the tap, and ignoring it leaves the app
 * exactly as it was.
 *
 * There is no second questionnaire either. They answered in onboarding; the
 * offer is built from that answer. See `planStartOffer`.
 */
import { StyleSheet, View } from 'react-native';
import { Text } from '../../components/common/Text';
import ChunkyButton from '../../components/common/ChunkyButton';
import Icon from '../../components/common/icons/Icon';
import PlanGeneratingBar from './PlanGeneratingBar';
import type { PlanStartOffer } from './domain/planStart';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

/** Big enough to hold the middle of an empty screen on its own. */
const MARK_SIZE = 56;

interface PlanStartEmptyStateProps {
  offer: PlanStartOffer;
  onStart: () => void;
  isStarting: boolean;
  /** Shown under the button; the state stays put so they can retry. */
  hasFailed: boolean;
}

export default function PlanStartEmptyState({
  offer,
  onStart,
  isStarting,
  hasFailed,
}: PlanStartEmptyStateProps) {
  // While it generates, the bar is the whole screen. Keeping the offer behind
  // it would leave its copy — the plan's length, what starting it changes —
  // being read as a description of something already under way.
  if (isStarting) {
    return (
      <View style={styles.empty}>
        <PlanGeneratingBar />
      </View>
    );
  }

  return (
    <View style={styles.empty}>
      <Icon name="calendar" size={MARK_SIZE} color={colors.playful.sky.base} />

      <View style={styles.copy}>
        <Text style={styles.title}>Your plan is ready</Text>
        <Text style={styles.body}>
          {offer.isFallback
            ? `${offer.planName} is ${offer.weeks} weeks, building one day at a time.`
            : `${offer.planName} is ${offer.weeks} weeks, built around the goal you picked when you joined.`}
        </Text>
        {/* The one consequence worth naming before the tap: their mornings
            change. Everything else about the plan is visible afterwards. */}
        <Text style={styles.body}>
          Starting it means Home follows the plan’s days from tomorrow.
        </Text>
      </View>

      <ChunkyButton
        label="Start my plan"
        onPress={onStart}
        style={styles.button}
      />

      {hasFailed ? (
        <Text style={styles.failure}>
          That didn’t go through. Please try again.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  copy: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  body: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  // Sized to its label and centred, rather than stretched across the canvas:
  // there is no card edge here for a full-width button to line up with.
  button: {
    alignSelf: 'center',
  },
  failure: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
