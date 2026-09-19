/**
 * The plan's analytics: one card per thing being said.
 *
 * A card is a claim. Last week's counts, how the Resets went and what moves
 * the user's days are three separate claims that happen to be built from the
 * same two queries — stacked into one card they read as a report nobody asked
 * for, and the reader has to work out where one finding stops and the next
 * begins.
 *
 * Findings rather than a dashboard. "How was last week" is a number somebody
 * already knows; "your days go better when you Reset" and "your hard days are
 * work days" are answers to questions they would actually ask.
 *
 * Nothing here claims a cause. Every line is a difference between two sets of
 * the user's own days, and each is perfectly capable of reporting that the
 * Resets went badly.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Text } from '../../components/common/Text';
import CardSurface from '../../components/common/CardSurface';
import CardTitle from '../../components/common/CardTitle';
import Icon from '../../components/common/icons/Icon';
import { ComparisonBars, FactorBars } from './AnalyticsBars';
import {
  MOOD_FACES,
  MOOD_SCALES,
  moodLevel,
} from '../mood/domain/moodCheckIn';
import MoodTrendChart from './MoodTrendChart';
import type { MoodTrendPoint } from './domain/moodAnalytics';
import {
  compareToBefore,
  DAYS_IN_WEEK,
  type WeeklyReview,
  type WeeklyReviewDirection,
} from './domain/weeklyReview';
import type { FactorEffects, ResetEffect } from './domain/moodAnalytics';
import type { MoodFaceName } from '../mood/domain/moodCheckIn';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

/** A tenth of a point either way is a rounding artefact, not a better week. */
const MOOD_DEADBAND = 0.1;
const LOCK_ICON = 18;
/** One line of the lock's label, which the padlock is centred against. */
const LOCK_LINE_HEIGHT = 22;
/** Enough that a figure is a shape rather than a number you can squint at. */
const BLUR_INTENSITY = 18;

const DIRECTION_INK: Record<WeeklyReviewDirection, string> = {
  up: colors.playful.teal.ink,
  down: colors.text.secondary,
  same: colors.text.secondary,
};

function directionLine(
  direction: WeeklyReviewDirection | null,
  before: string,
): string | null {
  if (direction == null) return null;
  if (direction === 'same') return 'Same as the week before';
  return `${direction === 'up' ? 'Up' : 'Down'} from ${before}`;
}

/**
 * Check-ins it usually takes before either finding has both sides of a
 * comparison behind it. Used for the countdown only — what actually opens the
 * cards is the findings existing, so the copy falls back to a plain nudge
 * rather than promising a day that has already passed.
 */
const INSIGHT_DAYS = 10;

interface FindingCardProps {
  title: string;
  note: string;
  /** Blurred over, with the reason, when the finding cannot be trusted yet. */
  locked?: boolean;
  /** What the lock says. */
  lockLabel?: string;
  children: ReactNode;
}

/**
 * One claim, one card.
 *
 * Locked means blurred rather than replaced, so the card keeps its shape and
 * nothing on the page moves when it opens — and what is behind the blur is
 * the user's own thin data, never an invented preview.
 */
function FindingCard({
  title,
  note,
  locked = false,
  lockLabel,
  children,
}: FindingCardProps) {
  return (
    <CardSurface style={styles.card}>
      <View
        style={styles.body}
        pointerEvents={locked ? 'none' : 'auto'}
        accessibilityElementsHidden={locked}
        importantForAccessibility={locked ? 'no-hide-descendants' : 'auto'}
      >
        <View style={styles.heading}>
          <CardTitle title={title} />
          <Text style={styles.note}>{note}</Text>
        </View>
        {children}
      </View>

      {locked ? (
        <BlurView
          intensity={BLUR_INTENSITY}
          tint="light"
          experimentalBlurMethod="dimezisBlurView"
          style={styles.lock}
        >
          <View style={styles.lockCopy}>
            {/* On the first line, not centred against the block: the label
                wraps to two lines and a padlock floating between them reads
                as a bullet for the second one. */}
            <View style={styles.lockIcon}>
              <Icon name="lock" size={LOCK_ICON} color={colors.text.secondary} />
            </View>
            <Text style={styles.lockLabel}>{lockLabel}</Text>
          </View>
        </BlurView>
      ) : null}
    </CardSurface>
  );
}

/** The face and the word the check-in would have used for a mean. */
function describeMood(value: number) {
  const level = moodLevel(((value - 1) / 4) * 100);

  return {
    face: MOOD_FACES[level - 1],
    word: MOOD_SCALES[0].labels[level - 1],
  };
}

const MOOD_FACE_SIZE = 34;

/**
 * One figure from the last closed week.
 *
 * Built like the heart screen's stat cards — label above, figure below,
 * movement under that — because it is the same kind of thing and the app
 * should only have one way of drawing a number.
 */
function StatCard({
  label,
  value,
  /** Drawn beside the value: a mood is a face before it is a number. */
  face,
  footnote,
  direction,
  before,
}: {
  label: string;
  value: string;
  face?: MoodFaceName;
  footnote?: string;
  direction: WeeklyReviewDirection | null;
  before: string;
}) {
  return (
    <CardSurface containerStyle={styles.statWrap} style={styles.statCard}>
      <CardTitle title={label} />
      <View style={styles.statValueRow}>
        {face == null ? null : (
          <Icon
            name={face}
            size={MOOD_FACE_SIZE}
            color={colors.playful.sky.ink}
          />
        )}
        <Text style={styles.statValue}>{value}</Text>
      </View>
      {footnote == null ? null : (
        <Text style={styles.statFootnote}>{footnote}</Text>
      )}
      {direction == null ? null : (
        <Text style={[styles.delta, { color: DIRECTION_INK[direction] }]}>
          {directionLine(direction, before)}
        </Text>
      )}
    </CardSurface>
  );
}

/** The two figures, side by side, each its own card. */
function WeekCards({ review }: { review: WeeklyReview }) {
  const keptDirection = compareToBefore(review.daysKept, review.daysKeptBefore);
  const moodDirection =
    review.mood == null
      ? null
      : compareToBefore(review.mood, review.moodBefore, MOOD_DEADBAND);

  return (
    <View style={styles.statRow}>
      <StatCard
        label="Days kept"
        value={`${review.daysKept}/${DAYS_IN_WEEK}`}
        direction={keptDirection}
        before={`${review.daysKeptBefore}`}
      />

      {/* A week with barely any check-ins has no average worth printing. */}
      {review.mood == null ? null : (
        <StatCard
          label="Average mood"
          value={describeMood(review.mood).word}
          face={describeMood(review.mood).face}
          // The mean stays, small: it is the honest figure behind the word,
          // and "3.6" was never a thing anybody could picture.
          footnote={`${review.mood.toFixed(1)} average`}
          direction={moodDirection}
          before={review.moodBefore?.toFixed(1) ?? ''}
        />
      )}
    </View>
  );
}

/**
 * What a finding looks like before it exists.
 *
 * Shown once, in place of both findings, rather than two locked cards saying
 * the same thing to somebody who has answered three check-ins.
 */
const PLACEHOLDER_RESET: ResetEffect = {
  keptShare: 0.78,
  missedShare: 0.5,
  keptDays: 0,
  missedDays: 0,
};

interface PlanAnalyticsSectionProps {
  review: WeeklyReview;
  /** Check-ins answered so far, which is what the countdown counts down. */
  daysAnswered: number;
  /** The last thirty days, gaps included. Empty until anything is answered. */
  trend: MoodTrendPoint[];
  /** Null until both sides of the comparison have enough days. */
  reset: ResetEffect | null;
  /** Null until some tag has been answered often enough to mean anything. */
  factors: FactorEffects | null;
}

export default function PlanAnalyticsSection({
  review,
  daysAnswered,
  trend,
  reset,
  factors,
}: PlanAnalyticsSectionProps) {
  const hasTrend = trend.some((point) => point.value != null);
  // Locked on evidence, not on time served: a card appears when what it would
  // say can be trusted, which is the only honest thing for it to wait on.
  if (reset == null && factors == null) {
    // The week's figures go with them. Two counts under a blurred card is a
    // section that has not started yet pretending to be one that has.
    const remaining = INSIGHT_DAYS - daysAnswered;

    return (
      <FindingCard
        locked
        lockLabel={
          remaining > 0
            ? `${remaining} more ${
                remaining === 1 ? 'day' : 'days'
              } of doing your plan to unlock your insights!`
            : 'Keep going to unlock your insights!'
        }
        title="Your days go better when you Reset"
        note="Days rated okay or better"
      >
        <ComparisonBars
          rows={[
            {
              key: 'kept',
              label: 'Days you Reset',
              share: PLACEHOLDER_RESET.keptShare,
              strong: true,
            },
            {
              key: 'missed',
              label: 'Days you didn’t',
              share: PLACEHOLDER_RESET.missedShare,
              strong: false,
            },
          ]}
        />
      </FindingCard>
    );
  }

  return (
    <>
      <WeekCards review={review} />

      {hasTrend ? (
        <FindingCard
          title="Your mood"
          note={`The last ${trend.length} days · 1 to 5`}
        >
          <MoodTrendChart points={trend} />
        </FindingCard>
      ) : null}

      {/* The one comparison nobody else in this category can make: we know
          the day was kept without having asked. */}
      {reset == null ? null : (
        <FindingCard
          title={
            reset.keptShare >= reset.missedShare
              ? 'Your days go better when you Reset'
              : 'Your Resets land on your harder days'
          }
          note={`Days rated okay or better, over ${
            reset.keptDays + reset.missedDays
          } check-ins`}
        >
          <ComparisonBars
            rows={[
              {
                key: 'kept',
                label: `Days you Reset · ${reset.keptDays}`,
                share: reset.keptShare,
                strong: reset.keptShare >= reset.missedShare,
              },
              {
                key: 'missed',
                label: `Days you didn’t · ${reset.missedDays}`,
                share: reset.missedShare,
                strong: reset.missedShare > reset.keptShare,
              },
            ]}
          />
        </FindingCard>
      )}

      {factors == null ? null : (
        <FindingCard
          title="What moves your days"
          note={`Against your own average of ${factors.baseline.toFixed(1)}`}
        >
          <FactorBars better={factors.better} harder={factors.harder} />
        </FindingCard>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  // Clipped, so a blur stops at the card's own corners. Padding matches the
  // heart screen's cards, which these are siblings of in everything but
  // subject.
  card: {
    padding: spacing.md,
    gap: spacing.md,
    overflow: 'hidden',
  },
  body: {
    gap: spacing.md,
  },
  heading: {
    gap: 2,
  },
  // The size the plan's week cards title themselves at, so every card on the
  // screen speaks at one volume.
  note: {
    ...typography.label.detail,
    color: colors.text.tertiary,
  },
  // Two peers on one row, at the gap the cards under them are stacked at.
  statRow: {
    flexDirection: 'row',
    gap: spacing.sm + spacing.xs,
  },
  statWrap: {
    flex: 1,
  },
  statCard: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  // The heart screen's figure size. A stat card whose number is not the
  // largest thing on it is a label with a footnote.
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    ...typography.stat.valueMedium,
    color: colors.text.primary,
    flexShrink: 1,
  },
  statFootnote: {
    ...typography.label.detail,
    color: colors.text.tertiary,
    fontVariant: ['tabular-nums'],
  },
  delta: {
    ...typography.label.small,
  },
  // Over the whole card rather than a band across it: half a blurred figure
  // and half a sharp one reads as a rendering fault.
  lock: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.overlay.light,
  },
  lockCopy: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  // Optically centred on the first line's height, not on the whole label.
  lockIcon: {
    height: LOCK_LINE_HEIGHT,
    justifyContent: 'center',
  },
  lockLabel: {
    ...typography.label.large,
    lineHeight: LOCK_LINE_HEIGHT,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
    flexShrink: 1,
    textAlign: 'center',
  },
});
