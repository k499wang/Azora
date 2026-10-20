/**
 * The profile's insights: one card per thing being said.
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
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

/** A tenth of a point either way is a rounding artefact, not a better week. */
const MOOD_DEADBAND = 0.1;
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

interface FindingCardProps {
  title: string;
  note: string;
  children: ReactNode;
}

function FindingCard({ title, note, children }: FindingCardProps) {
  return (
    <CardSurface style={styles.card}>
      <View style={styles.body}>
        <View style={styles.heading}>
          <CardTitle title={title} />
          <Text style={styles.note}>{note}</Text>
        </View>
        {children}
      </View>
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

interface MoodInsightCardsProps {
  /** Null while activity is still loading. */
  review: WeeklyReview | null;
  /** The trend window, gaps included. */
  trend: MoodTrendPoint[];
  /** Null until both sides of the comparison have enough days. */
  reset: ResetEffect | null;
  /** Null until some tag has been answered often enough to mean anything. */
  factors: FactorEffects | null;
}

export default MoodInsightCards;

/** The insights themselves, with no lock: each card shows when its data exists. */
export function MoodInsightCards({
  review,
  trend,
  reset,
  factors,
}: MoodInsightCardsProps) {
  const hasTrend = trend.some((point) => point.value != null);

  return (
    <>
      {review == null ? null : <WeekCards review={review} />}

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
  card: {
    ...card.lipped,
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
    ...card.lipped,
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
});
