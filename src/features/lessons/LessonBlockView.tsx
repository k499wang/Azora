import { StyleSheet, View } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import { Text } from '../../components/common/Text';
import type { LessonBlock } from './domain/lessonCatalogue';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

/**
 * Slide-sized, not article-sized.
 *
 * A block is a page of its own with nothing else on it, so the text is set at
 * something closer to a headline than to body copy. Forty words is the most a
 * block may carry, which at this size is a comfortable page on the shortest
 * phone we support rather than a wall to get through.
 */
const BODY_SIZE = 22;
const BODY_LINE_HEIGHT = 32;
const FACT_VALUE_SIZE = 56;
const FACT_VALUE_LINE_HEIGHT = 62;
const TERM_SIZE = 18;
const LIST_TEXT_SIZE = 18;
const LIST_TEXT_LINE_HEIGHT = 25;

/**
 * Splits a lesson's prose into its plain and bolded runs.
 *
 * The emphasis is authored in the catalogue, two or three words a paragraph,
 * chosen so that reading only the bold gives you the lesson. It is marked in
 * the text rather than structured around it because that is how it is written
 * and reviewed — a paragraph split into an array of fragments is a paragraph
 * nobody can read in the file it lives in.
 */
function proseRuns(text: string): { text: string; bold: boolean }[] {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter((part) => part.length > 0)
    .map((part) =>
      part.startsWith('**') && part.endsWith('**')
        ? { text: part.slice(2, -2), bold: true }
        : { text: part, bold: false },
    );
}

function Prose({
  text,
  style,
}: {
  text: string;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text style={[styles.body, style]}>
      {proseRuns(text).map((run, index) => (
        <Text key={index} style={run.bold ? styles.bold : undefined}>
          {run.text}
        </Text>
      ))}
    </Text>
  );
}

/**
 * One piece of a lesson.
 *
 * Every kind is drawn here rather than in the screen, so a lesson is laid out
 * the same way wherever one is shown and a new kind of block is one case rather
 * than an edit to every screen that can show one.
 */
export default function LessonBlockView({ block }: { block: LessonBlock }) {
  switch (block.kind) {
    case 'text':
      return <Prose text={block.text} />;

    case 'fact':
      return (
        <View style={[card.base, card.shadow, styles.fact]}>
          <Text style={styles.factValue}>{block.value}</Text>
          <Text style={styles.factCaption}>{block.caption}</Text>
        </View>
      );

    case 'list':
      return (
        <View style={styles.list}>
          {block.items.map((item) => (
            <View key={item.term} style={styles.listItem}>
              <Text style={styles.term}>{item.term}</Text>
              <Prose text={item.text} style={styles.listText} />
            </View>
          ))}
        </View>
      );

    case 'do':
      return (
        <View style={styles.doBlock}>
          <Text style={styles.doLabel}>Try this today</Text>
          <Prose text={block.text} style={styles.doText} />
        </View>
      );
  }
}

const styles = StyleSheet.create({
  body: {
    fontSize: BODY_SIZE,
    lineHeight: BODY_LINE_HEIGHT,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
  },
  // The skim path. Semibold rather than bold, like everything else.
  bold: {
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  fact: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  factValue: {
    fontSize: FACT_VALUE_SIZE,
    lineHeight: FACT_VALUE_LINE_HEIGHT,
    letterSpacing: -0.8,
    fontFamily: fonts.semibold,
    color: colors.primary.blue500,
  },
  factCaption: {
    ...typography.body.small,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  list: {
    gap: spacing.lg,
  },
  listItem: {
    gap: spacing.xs,
  },
  term: {
    fontSize: TERM_SIZE,
    lineHeight: TERM_SIZE + 6,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  listText: {
    fontSize: LIST_TEXT_SIZE,
    lineHeight: LIST_TEXT_LINE_HEIGHT,
  },
  doBlock: {
    backgroundColor: colors.playful.teal.soft,
    borderRadius: radius.medium,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  doLabel: {
    ...typography.overline,
    color: colors.playful.teal.ink,
  },
  doText: {
    color: colors.playful.teal.ink,
  },
});
