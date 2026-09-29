import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
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
 * something closer to a headline than to body copy. Forty-five words is the most a
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

function TodayAction({ text }: { text: string }) {
  const [response, setResponse] = useState<'try' | 'adapt' | null>(null);
  return (
    <View style={styles.doBlock}>
      <Text style={styles.doLabel}>For today</Text>
      <Prose text={text} style={styles.doText} />
      <View style={styles.actionResponses}>
        {([
          ['try', "I'll try this"],
          ['adapt', "I'll adapt it"],
        ] as const).map(([value, label]) => (
          <Pressable
            key={value}
            onPress={() => setResponse(value)}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: response === value }}
            style={({ pressed }) => [
              styles.actionResponse,
              response === value && styles.actionResponseSelected,
              pressed && styles.optionPressed,
            ]}
          >
            <Text style={[styles.actionResponseText, response === value && styles.actionResponseTextSelected]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
      {response ? (
        <Text style={styles.actionFeedback} accessibilityLiveRegion="polite">
          {response === 'try'
            ? 'Great. Look for one small chance to practice today.'
            : 'Good idea. Make the step small enough to fit your day.'}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * One piece of a lesson.
 *
 * Every kind is drawn here rather than in the screen, so a lesson is laid out
 * the same way wherever one is shown and a new kind of block is one case rather
 * than an edit to every screen that can show one.
 */
export default function LessonBlockView({
  block,
  selectedOption,
  onSelectOption,
}: {
  block: LessonBlock;
  selectedOption?: number;
  onSelectOption?: (index: number) => void;
}) {
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

    case 'choice':
      return (
        <View style={styles.choice}>
          <Prose text={block.prompt} />
          <View style={styles.options}>
            {block.options.map((option, index) => {
              const isSelected = selectedOption === index;
              const isDimmed = selectedOption != null && !isSelected;
              return (
                <Pressable
                  key={index}
                  onPress={() => onSelectOption?.(index)}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected: isSelected }}
                  style={({ pressed }) => [
                    styles.option,
                    isSelected && styles.optionSelected,
                    isDimmed && styles.optionDimmed,
                    pressed && styles.optionPressed,
                  ]}
                >
                  <View style={[styles.optionMarker, isSelected && styles.optionMarkerSelected]}>
                    <Text style={[styles.optionMarkerText, isSelected && styles.optionMarkerTextSelected]}>
                      {String.fromCharCode(65 + index)}
                    </Text>
                  </View>
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
          {selectedOption != null ? (
            <View style={styles.feedback} accessibilityLiveRegion="polite">
              <Text style={styles.feedbackLabel}>Notice this</Text>
              <Text style={styles.feedbackText}>{block.options[selectedOption]?.feedback}</Text>
            </View>
          ) : (
            <Text style={styles.choiceHint}>Choose a response to see what it teaches.</Text>
          )}
        </View>
      );

    case 'do':
      return <TodayAction text={block.text} />;
  }
}

const styles = StyleSheet.create({
  /**
   * Centred, like everything else on a slide.
   *
   * A block is a page with one thing on it. Ranged left, a short paragraph
   * hangs off the top corner of an empty screen; centred, the page is the
   * paragraph. It is the same reason the check-in centres its questions.
   */
  body: {
    fontSize: BODY_SIZE,
    lineHeight: BODY_LINE_HEIGHT,
    fontFamily: fonts.regular,
    color: colors.text.secondary,
    textAlign: 'center',
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
    alignItems: 'center',
  },
  term: {
    fontSize: TERM_SIZE,
    lineHeight: TERM_SIZE + 6,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
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
    alignItems: 'center',
  },
  doLabel: {
    ...typography.overline,
    color: colors.playful.teal.ink,
    textAlign: 'center',
  },
  doText: {
    color: colors.playful.teal.ink,
  },
  actionResponses: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignSelf: 'stretch',
  },
  actionResponse: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.medium,
    borderWidth: 2,
    borderColor: colors.playful.teal.tintDeep,
    backgroundColor: colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  actionResponseSelected: {
    borderColor: colors.playful.teal.ink,
    backgroundColor: colors.playful.teal.tint,
  },
  actionResponseText: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.playful.teal.ink,
    textAlign: 'center',
  },
  actionResponseTextSelected: { color: colors.playful.teal.ink },
  actionFeedback: {
    ...typography.body.small,
    color: colors.playful.teal.ink,
    textAlign: 'center',
  },
  choice: { gap: spacing.md },
  options: { gap: spacing.sm },
  option: {
    backgroundColor: colors.background.card,
    borderColor: colors.border.subtle,
    borderWidth: 2,
    borderRadius: radius.medium,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  optionSelected: {
    backgroundColor: colors.surface.selected,
    borderColor: colors.primary.blue500,
  },
  optionDimmed: { opacity: 0.5 },
  optionPressed: { transform: [{ scale: 0.98 }] },
  optionMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionMarkerSelected: { backgroundColor: colors.primary.blue500 },
  optionMarkerText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text.secondary,
  },
  optionMarkerTextSelected: { color: colors.text.inverse },
  optionText: {
    ...typography.body.medium,
    color: colors.text.primary,
    flex: 1,
  },
  optionTextSelected: { fontFamily: fonts.semibold },
  choiceHint: {
    ...typography.body.small,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  feedback: {
    backgroundColor: colors.playful.teal.soft,
    borderRadius: radius.medium,
    padding: spacing.md,
    gap: spacing.xs,
  },
  feedbackLabel: {
    ...typography.overline,
    color: colors.playful.teal.ink,
    textAlign: 'center',
  },
  feedbackText: {
    ...typography.body.medium,
    color: colors.playful.teal.ink,
    textAlign: 'center',
  },
});
