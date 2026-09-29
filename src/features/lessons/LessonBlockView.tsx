import { useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '../../components/common/Text';
import { triggerMissHaptic, triggerTapHaptic } from '../../native/tapHaptics';
import type { LessonBlock } from './domain/lessonCatalogue';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { duration } from '../../theme/motion';

/**
 * Slide-sized, not article-sized.
 *
 * The player turns authored prose into short slides of at most 45 words. The
 * larger type keeps one point readable at a time; scrolling remains available
 * for larger accessibility text settings.
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

const TODAY_RESPONSES = [
  { label: "I'll try this", feedback: 'Great. Look for one small chance to practice today.' },
  { label: "I'll adapt it", feedback: 'Good idea. Make the step small enough to fit your day.' },
] as const;

function TodayAction({ text, response, onRespond }: {
  text: string;
  response?: number;
  onRespond?: (index: number) => void;
}) {
  return (
    <View style={styles.doBlock}>
      <Text style={styles.doLabel}>For today</Text>
      <Prose text={text} style={styles.doText} />
      <View style={styles.actionResponses}>
        {TODAY_RESPONSES.map(({ label }, index) => (
          <Pressable
            key={label}
            onPress={() => onRespond?.(index)}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: response === index }}
            style={({ pressed }) => [
              styles.actionResponse,
              response === index && styles.actionResponseSelected,
              pressed && styles.optionPressed,
            ]}
          >
            <Text style={styles.actionResponseText}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function RevealActivity({ block, onComplete }: {
  block: Extract<LessonBlock, { kind: 'reveal' }>;
  onComplete?: () => void;
}) {
  const [open, setOpen] = useState<number[]>([]);
  const reducedMotion = useReducedMotion();
  return (
    <View style={styles.choice}>
      <Prose text={block.prompt} />
      <Text style={styles.choiceHint}>Tap each card to see what it means.</Text>
      {block.items.map((item, index) => (
        <Pressable
          key={item.label}
          onPress={() => {
            if (open.includes(index)) return;
            triggerTapHaptic();
            const next = [...open, index];
            setOpen(next);
            if (next.length === block.items.length) onComplete?.();
          }}
          accessibilityRole="button"
          accessibilityLabel={item.label}
          accessibilityState={{ expanded: open.includes(index) }}
          style={[styles.revealCard, open.includes(index) && styles.revealCardOpen]}
        >
          <Text style={styles.revealLabel}>{item.label}</Text>
          {open.includes(index) ? (
            <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(duration.base)} accessibilityLiveRegion="polite">
              <Text style={styles.revealDetail}>{item.detail}</Text>
            </Animated.View>
          ) : <Text style={styles.revealTap}>Tap to reveal</Text>}
        </Pressable>
      ))}
    </View>
  );
}

function SequenceActivity({ block, onComplete }: {
  block: Extract<LessonBlock, { kind: 'sequence' }>;
  onComplete?: () => void;
}) {
  const [nextStep, setNextStep] = useState(0);
  return (
    <View style={styles.choice}>
      <Prose text={block.prompt} />
      <Text style={styles.choiceHint}>Tap the steps in the order you would do them.</Text>
      {[...block.steps].reverse().map((step, reversedIndex) => {
        const index = block.steps.length - reversedIndex - 1;
        return (
          <SequenceStep
            key={step}
            step={step}
            position={index + 1}
            done={index < nextStep}
            onPress={() => {
              if (index !== nextStep) return false;
              setNextStep(index + 1);
              if (index + 1 === block.steps.length) onComplete?.();
              return true;
            }}
          />
        );
      })}
    </View>
  );
}

const SHAKE_OFFSET = 8;
const SHAKE_STEP_MS = 50;

/**
 * A wrong pick shakes and flashes where it was tapped instead of adding a line
 * of text, which would push every step below it down the page.
 */
function SequenceStep({ step, position, done, onPress }: {
  step: string;
  position: number;
  done: boolean;
  /** False when this was not the step asked for. */
  onPress: () => boolean;
}) {
  const reducedMotion = useReducedMotion();
  const offset = useSharedValue(0);
  const miss = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));
  const missStyle = useAnimatedStyle(() => ({ opacity: miss.value }));
  return (
    <Animated.View style={shakeStyle}>
      <Pressable
        onPress={() => {
          if (done) return;
          if (onPress()) {
            triggerTapHaptic();
            return;
          }
          triggerMissHaptic();
          AccessibilityInfo.announceForAccessibility('Try the first step you would take from here.');
          miss.value = withSequence(
            withTiming(1, { duration: duration.fast }),
            withTiming(0, { duration: duration.slow }),
          );
          if (reducedMotion) return;
          offset.value = withSequence(
            withTiming(-SHAKE_OFFSET, { duration: SHAKE_STEP_MS }),
            withTiming(SHAKE_OFFSET, { duration: SHAKE_STEP_MS }),
            withTiming(-SHAKE_OFFSET / 2, { duration: SHAKE_STEP_MS }),
            withTiming(SHAKE_OFFSET / 2, { duration: SHAKE_STEP_MS }),
            withTiming(0, { duration: SHAKE_STEP_MS }),
          );
        }}
        accessibilityRole="button"
        accessibilityLabel={step}
        accessibilityState={{ selected: done }}
        style={[styles.option, done && styles.optionSelected]}
      >
        <Animated.View pointerEvents="none" style={[styles.optionMiss, missStyle]} />
        <View style={[styles.optionMarker, done && styles.optionMarkerSelected]}>
          <Text style={[styles.optionMarkerText, done && styles.optionMarkerTextSelected]}>{done ? position : '?'}</Text>
        </View>
        <Text style={styles.optionText}>{step}</Text>
      </Pressable>
    </Animated.View>
  );
}

/** The kinds that wait for the reader to do something before moving on. */
export function isLessonActivity(block: LessonBlock | undefined): boolean {
  return block?.kind === 'choice' || block?.kind === 'reveal' || block?.kind === 'sequence';
}

/**
 * What an answered block says back. A reveal has already said it on its cards;
 * the day's step answers with no label because its own card already names it.
 */
export function activityFeedback(
  block: LessonBlock,
  selectedOption: number | undefined,
): { label?: string; text: string } | null {
  if (block.kind === 'choice' && selectedOption != null) {
    const option = block.options[selectedOption];
    return option == null ? null : { label: 'Notice this', text: option.feedback };
  }
  if (block.kind === 'sequence') return { label: 'You put it together', text: block.feedback };
  if (block.kind === 'do' && selectedOption != null) {
    const response = TODAY_RESPONSES[selectedOption];
    return response == null ? null : { text: response.feedback };
  }
  return null;
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
  onComplete,
}: {
  block: LessonBlock;
  selectedOption?: number;
  onSelectOption?: (index: number) => void;
  onComplete?: () => void;
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
          <Text style={styles.choiceHint}>Choose a response to see what it teaches.</Text>
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
        </View>
      );

    case 'reveal':
      return <RevealActivity block={block} onComplete={onComplete} />;

    case 'sequence':
      return <SequenceActivity block={block} onComplete={onComplete} />;

    case 'do':
      return <TodayAction text={block.text} response={selectedOption} onRespond={onSelectOption} />;
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
    textAlign: 'center',
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
  optionMiss: {
    ...StyleSheet.absoluteFillObject,
    margin: -2,
    borderRadius: radius.medium,
    borderWidth: 2,
    borderColor: colors.error[500],
    backgroundColor: colors.error[100],
  },
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
  revealCard: {
    backgroundColor: colors.background.card,
    borderColor: colors.border.subtle,
    borderWidth: 2,
    borderRadius: radius.medium,
    padding: spacing.md,
    gap: spacing.xs,
    minHeight: 64,
  },
  revealCardOpen: { borderColor: colors.primary.blue500, backgroundColor: colors.surface.selected },
  revealLabel: { ...typography.body.medium, fontFamily: fonts.semibold, color: colors.text.primary },
  revealDetail: { ...typography.body.small, color: colors.text.secondary },
  revealTap: { ...typography.body.small, color: colors.text.tertiary },
});
