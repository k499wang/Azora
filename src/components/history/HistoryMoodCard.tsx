/**
 * What the day was actually answered, a card a question.
 *
 * The calendar colours a day by its score, which is a mean of three scales and
 * so is the one thing nobody answered. These are the answers themselves: the
 * face given to each question and the word that sat under it.
 *
 * Drawn with `HistoryDayRow`, the same card every other section of the day
 * uses — a check-in is one more thing that happened that day, and a card of
 * its own design would say it belongs to a different screen. Each scale keeps
 * its hue from the rest of the app: the check-in's blush, energy's amber,
 * sleep's violet.
 *
 * Every scale gets a card whether or not it was answered — a question left
 * blank says something, and dropping it would quietly make a partial check-in
 * look like a complete one.
 */
import { StyleSheet, View } from 'react-native';
import HistoryDayRow from './HistoryDayRow';
import Icon from '../common/icons/Icon';
import {
  MOOD_FACES,
  MOOD_SCALES,
  MOOD_SCALE_MAX,
  MOOD_SCALE_MIN,
  type MoodAnswers,
  type MoodScaleId,
} from '../../features/mood/domain/moodCheckIn';
import { MOOD_TAGS } from '../../features/mood/domain/moodTags';
import type { PlayfulHue } from '../../features/exercise/guidedBreathing/categoryPalette';
import { radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { Text } from '../common/Text';

const PIP_SIZE = 8;
const TAG_ICON = 14;

const PIPS = Array.from(
  { length: MOOD_SCALE_MAX - MOOD_SCALE_MIN + 1 },
  (_, index) => MOOD_SCALE_MIN + index,
);

/** The hues these three already wear elsewhere in the app. */
const SCALE_HUE: Record<MoodScaleId, PlayfulHue> = {
  overall: colors.playful.blush,
  energy: colors.playful.amber,
  sleep: colors.playful.violet,
};

/** Stands in for a face on a question that was never answered. */
const UNANSWERED_FACE = 'face-neutral';

interface HistoryMoodCardProps {
  answers: MoodAnswers;
  /** What else was going on. Nothing is drawn when none were given. */
  tags: string[];
  /** The line they wrote that day, if they wrote one. */
  note: string | null;
}

export default function HistoryMoodCard({
  answers,
  tags,
  note,
}: HistoryMoodCardProps) {
  const chosen = MOOD_TAGS.filter((tag) => tags.includes(tag.id));

  return (
    <View style={styles.rows}>
      {MOOD_SCALES.map((scale) => {
        const rating = answers[scale.id];
        const hue = SCALE_HUE[scale.id];

        return (
          <HistoryDayRow
            key={scale.id}
            icon={rating == null ? UNANSWERED_FACE : MOOD_FACES[rating - 1]}
            hue={hue}
            title={rating == null ? 'Not answered' : scale.labels[rating - 1]}
            meta={scale.question}
            completed={false}
            muted={rating == null}
            trailing={
              /* Where the answer sat on the row of five, so a "Good" can be
                 read as the fourth face rather than as a loose word. */
              <View style={styles.pips}>
                {PIPS.map((point) => (
                  <View
                    key={point}
                    style={[
                      styles.pip,
                      { backgroundColor: hue.soft },
                      rating != null &&
                        point <= rating && { backgroundColor: hue.base },
                    ]}
                  />
                ))}
              </View>
            }
          />
        );
      })}

      {/* Under the ratings, not beside them: what was going on is context for
          all three answers rather than another answer. */}
      {/* Their own words come before our chips: it is the only thing on this
          card the app did not put words in the mouth of. */}
      {note == null ? null : <Text style={styles.note}>{note}</Text>}

      {chosen.length === 0 ? null : (
        <View style={styles.tags}>
          {chosen.map((tag) => (
            <View key={tag.id} style={styles.tag}>
              <Icon
                name={tag.icon}
                size={TAG_ICON}
                color={colors.playful.sky.ink}
              />
              <Text style={styles.tagLabel}>{tag.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rows: {
    gap: spacing.sm,
  },
  pips: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  pip: {
    width: PIP_SIZE,
    height: PIP_SIZE,
    borderRadius: PIP_SIZE / 2,
  },
  note: {
    ...typography.body.medium,
    color: colors.text.primary,
    paddingTop: spacing.xs,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    borderCurve: 'continuous',
    backgroundColor: colors.playful.sky.soft,
  },
  tagLabel: {
    ...typography.label.detail,
    fontFamily: fonts.semibold,
    color: colors.playful.sky.ink,
  },
});
