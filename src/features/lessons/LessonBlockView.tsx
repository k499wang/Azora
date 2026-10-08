import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '../../components/common/Text';
import { startUiTimer } from '../../lib/ui/uiThreadTimer';
import {
  triggerMissHaptic,
  triggerSoftHaptic,
  triggerSuccessHaptic,
  triggerTapHaptic,
} from '../../native/tapHaptics';
import type { LessonBlock } from './domain/lessonCatalogue';
import { arrangeBankOrder } from './domain/lessonArrange';
import { radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { duration, easing } from '../../theme/motion';

/**
 * Story-sized, not article-sized.
 *
 * The player turns authored prose into short lines of at most 45 words. The
 * larger type keeps one point readable at a time as the feed grows under it.
 */
const BODY_SIZE = 22;
const BODY_LINE_HEIGHT = 32;
const FACT_VALUE_SIZE = 48;
const FACT_VALUE_LINE_HEIGHT = 54;
const FACT_CAPTION_SIZE = 18;
const FACT_CAPTION_LINE_HEIGHT = 26;
const TERM_SIZE = 18;
const LIST_TEXT_SIZE = 18;
const LIST_TEXT_LINE_HEIGHT = 25;

const ENTRANCE_MS = 400;
const ENTRANCE_RISE = 20;
/** Long enough after a line lands that the marker reads as a second beat. */
const HIGHLIGHT_DELAY_MS = 350;
const BOX_SIZE = 40;
const LIP = 4;
const LIP_PRESSED = 2;
const SHAKE_OFFSET = 8;
const SHAKE_STEP_MS = 50;
const MISS_MS = 820;
const EYEBROW_SIZE = 13;
const EYEBROW_LINE_HEIGHT = 16;
const SLOT_HEIGHT = 46;

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

interface ProseProps {
  text: string;
  style?: StyleProp<TextStyle>;
}

/**
 * The bold runs pick up a highlighter a beat after the line lands. Switched on
 * rather than swept: a nested run's width cannot be animated reliably on both
 * platforms, and a half-drawn marker is worse than none.
 */
function Prose({ text, style }: ProseProps) {
  const runs = useMemo(() => proseRuns(text), [text]);
  const hasBold = runs.some((run) => run.bold);
  const [marked, setMarked] = useState(false);
  useEffect(() => {
    if (!hasBold) return;
    return startUiTimer(HIGHLIGHT_DELAY_MS, () => setMarked(true));
  }, [hasBold]);
  return (
    <Text style={[styles.body, style]}>
      {runs.map((run, index) => (
        <Text key={index} style={run.bold ? [styles.bold, marked && styles.marked] : undefined}>
          {run.text}
        </Text>
      ))}
    </Text>
  );
}

interface FeedEntranceProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * How anything joins the feed: it rises into place below what is already there,
 * on a transform, so nothing above it moves.
 */
export function FeedEntrance({ children, style }: FeedEntranceProps) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(reducedMotion ? 1 : 0);
  useEffect(() => {
    if (reducedMotion) return;
    progress.value = withTiming(1, { duration: ENTRANCE_MS, easing: easing.enter });
  }, [progress, reducedMotion]);
  const entranceStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * ENTRANCE_RISE }],
  }));
  return (
    <Animated.View style={[style, entranceStyle]} accessibilityLiveRegion="polite">
      {children}
    </Animated.View>
  );
}

interface FeedbackLineProps {
  text: string;
}

function FeedbackLine({ text }: FeedbackLineProps) {
  return (
    <FeedEntrance style={styles.feedback}>
      <Prose text={text} style={styles.feedbackText} />
    </FeedEntrance>
  );
}

type RowState = 'idle' | 'picked' | 'disabled';

interface ChoiceRowProps {
  label: string;
  state: RowState;
  onPress: () => void;
}

/** A Stories answer: a lip checkbox and its label. Picked once, for good. */
function ChoiceRow({ label, state, onPress }: ChoiceRowProps) {
  const picked = state === 'picked';
  const disabled = state === 'disabled';
  return (
    <Pressable
      onPress={onPress}
      disabled={state !== 'idle'}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: picked, disabled }}
      style={styles.choiceRow}
    >
      {({ pressed }) => (
        <>
          <View style={styles.boxSlot}>
            <View
              style={[
                styles.box,
                (pressed || state !== 'idle') && styles.boxDown,
                picked && styles.boxPicked,
                disabled && styles.boxDisabled,
              ]}
            >
              {picked ? (
                <Svg width={22} height={22} viewBox="0 0 22 22">
                  <Path
                    d="M5.5 11.5l4 4 7-8"
                    stroke={colors.text.inverse}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </Svg>
              ) : null}
            </View>
          </View>
          <Text style={[styles.choiceLabel, picked && styles.choiceLabelPicked, disabled && styles.choiceLabelDisabled]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

interface ChoiceRowsProps {
  labels: readonly string[];
  selected?: number;
  onSelect?: (index: number) => void;
}

function ChoiceRows({ labels, selected, onSelect }: ChoiceRowsProps) {
  return (
    <View style={styles.rows}>
      {labels.map((label, index) => (
        <ChoiceRow
          key={label}
          label={label}
          state={selected == null ? 'idle' : selected === index ? 'picked' : 'disabled'}
          onPress={() => onSelect?.(index)}
        />
      ))}
    </View>
  );
}

const TODAY_RESPONSES = [
  { label: "I'll try this", feedback: 'Great. Look for one small chance to practice today.' },
  { label: "I'll adapt it", feedback: 'Good idea. Make the step small enough to fit your day.' },
] as const;

interface TodayActionProps {
  text: string;
  response?: number;
  onRespond?: (index: number) => void;
}

function TodayAction({ text, response, onRespond }: TodayActionProps) {
  const feedback = response == null ? null : TODAY_RESPONSES[response]?.feedback;
  return (
    <View style={styles.activity}>
      <Text style={styles.eyebrow}>For today</Text>
      <Prose text={text} />
      <ChoiceRows labels={TODAY_RESPONSES.map(({ label }) => label)} selected={response} onSelect={onRespond} />
      {feedback != null ? <FeedbackLine text={feedback} /> : null}
    </View>
  );
}

interface RevealActivityProps {
  block: Extract<LessonBlock, { kind: 'reveal' }>;
  onComplete?: () => void;
}

function RevealActivity({ block, onComplete }: RevealActivityProps) {
  const [open, setOpen] = useState<number[]>([]);
  return (
    <View style={styles.activity}>
      <Prose text={block.prompt} style={styles.prompt} />
      <View style={styles.rows}>
        {block.items.map((item, index) => {
          const isOpen = open.includes(index);
          return (
            <Pressable
              key={item.label}
              onPress={() => {
                if (isOpen) return;
                const next = [...open, index];
                setOpen(next);
                if (next.length === block.items.length) {
                  triggerSoftHaptic();
                  onComplete?.();
                } else {
                  triggerTapHaptic();
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ expanded: isOpen }}
            >
              {({ pressed }) => (
                <View style={[styles.lipRow, (pressed || isOpen) && styles.lipRowDown, isOpen && styles.lipRowOpen]}>
                  <Text style={[styles.lipRowLabel, isOpen && styles.lipRowLabelOpen]}>{item.label}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
      {open.map((index) => (
        <FeedbackLine key={index} text={`**${block.items[index].label}.** ${block.items[index].detail}`} />
      ))}
    </View>
  );
}

interface ArrangeActivityProps {
  block: Extract<LessonBlock, { kind: 'sequence' }>;
  onComplete?: () => void;
}

/** Stories' Arrange: the steps sit shuffled in a bank and are tapped into order. */
function ArrangeActivity({ block, onComplete }: ArrangeActivityProps) {
  const [placed, setPlaced] = useState(0);
  const bank = useMemo(() => arrangeBankOrder(block.steps), [block.steps]);
  const done = placed === block.steps.length;
  return (
    <View style={styles.activity}>
      <Prose text={block.prompt} style={styles.prompt} />
      <View style={styles.slots}>
        {block.steps.map((step, index) => (
          <View key={step} style={styles.slot}>
            <Text style={styles.slotNumber}>{index + 1}</Text>
            <View style={styles.slotLine}>
              {index < placed ? (
                <FeedEntrance>
                  <Text style={styles.slotText}>{step}</Text>
                </FeedEntrance>
              ) : null}
            </View>
          </View>
        ))}
      </View>
      <View style={styles.bank}>
        {bank.map((stepIndex) => (
          <ArrangeChip
            key={block.steps[stepIndex]}
            label={block.steps[stepIndex]}
            used={stepIndex < placed}
            onPress={() => {
              if (stepIndex !== placed) return false;
              const next = placed + 1;
              setPlaced(next);
              if (next === block.steps.length) {
                triggerSuccessHaptic();
                onComplete?.();
              } else {
                triggerTapHaptic();
              }
              return true;
            }}
          />
        ))}
      </View>
      {done ? <FeedbackLine text={block.feedback} /> : null}
    </View>
  );
}

interface ArrangeChipProps {
  label: string;
  used: boolean;
  /** False when this was not the step asked for. */
  onPress: () => boolean;
}

/**
 * A wrong chip shakes and flashes where it sits instead of adding a line of
 * text, then settles back into the bank. A placed one leaves its shell, so the
 * bank never reflows under the next tap.
 */
function ArrangeChip({ label, used, onPress }: ArrangeChipProps) {
  const reducedMotion = useReducedMotion();
  const offset = useSharedValue(0);
  const miss = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));
  const missStyle = useAnimatedStyle(() => ({ opacity: miss.value }));
  return (
    <Animated.View style={shakeStyle}>
      <Pressable
        onPress={() => {
          if (used || onPress()) return;
          triggerMissHaptic();
          AccessibilityInfo.announceForAccessibility('Try the first step you would take from here.');
          miss.value = withSequence(
            withTiming(1, { duration: duration.fast }),
            withDelay(MISS_MS - duration.fast - duration.base, withTiming(0, { duration: duration.base })),
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
        disabled={used}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: used }}
      >
        {({ pressed }) => (
          <View style={[styles.chip, (pressed || used) && styles.chipDown, used && styles.chipUsed]}>
            <Animated.View pointerEvents="none" style={[styles.chipMiss, missStyle]} />
            <Text style={[styles.chipLabel, used && styles.chipLabelUsed]}>{label}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

/** The kinds that wait for the reader to answer before the feed moves on. */
export function isLessonActivity(block: LessonBlock | undefined): boolean {
  return block?.kind === 'choice' || block?.kind === 'reveal' || block?.kind === 'sequence' || block?.kind === 'do';
}

/** What an answered block says back, as the line that joins the feed under it. */
export function activityFeedback(block: LessonBlock, selectedOption: number | undefined): string | null {
  if (block.kind === 'choice' && selectedOption != null) return block.options[selectedOption]?.feedback ?? null;
  if (block.kind === 'sequence') return block.feedback;
  if (block.kind === 'do' && selectedOption != null) return TODAY_RESPONSES[selectedOption]?.feedback ?? null;
  return null;
}

interface LessonBlockViewProps {
  block: LessonBlock;
  selectedOption?: number;
  onSelectOption?: (index: number) => void;
  onComplete?: () => void;
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
}: LessonBlockViewProps) {
  switch (block.kind) {
    case 'text':
      return <Prose text={block.text} />;

    case 'fact':
      return (
        <View style={styles.fact}>
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

    case 'choice': {
      const feedback = activityFeedback(block, selectedOption);
      return (
        <View style={styles.activity}>
          <Prose text={block.prompt} style={styles.prompt} />
          <ChoiceRows
            labels={block.options.map((option) => option.label)}
            selected={selectedOption}
            onSelect={onSelectOption}
          />
          {feedback != null ? <FeedbackLine text={feedback} /> : null}
        </View>
      );
    }

    case 'reveal':
      return <RevealActivity block={block} onComplete={onComplete} />;

    case 'sequence':
      return <ArrangeActivity block={block} onComplete={onComplete} />;

    case 'do':
      return <TodayAction text={block.text} response={selectedOption} onRespond={onSelectOption} />;
  }
}

const styles = StyleSheet.create({
  // Ranged left: a feed is read top to bottom like a conversation.
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
  marked: {
    backgroundColor: colors.yellow[100],
  },
  prompt: {
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  fact: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  factValue: {
    fontSize: FACT_VALUE_SIZE,
    lineHeight: FACT_VALUE_LINE_HEIGHT,
    fontFamily: fonts.semibold,
    color: colors.primary.blue500,
    textAlign: 'center',
  },
  factCaption: {
    ...typography.body.small,
    fontSize: FACT_CAPTION_SIZE,
    lineHeight: FACT_CAPTION_LINE_HEIGHT,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  list: {
    gap: spacing.md,
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
  activity: { gap: spacing.md },
  eyebrow: {
    ...typography.overline,
    fontFamily: fonts.semibold,
    fontSize: EYEBROW_SIZE,
    lineHeight: EYEBROW_LINE_HEIGHT,
    color: colors.primary.blue500,
  },
  rows: { gap: spacing.sm },
  feedback: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.blue500,
    paddingLeft: spacing.md,
  },
  feedbackText: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: BOX_SIZE + spacing.sm,
  },
  boxSlot: { width: BOX_SIZE, height: BOX_SIZE },
  box: {
    height: BOX_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.small,
    borderWidth: 2,
    borderBottomWidth: LIP,
    borderColor: colors.border.subtle,
    borderBottomColor: colors.border.default,
    backgroundColor: colors.background.card,
  },
  // The lip gives up what the face drops, so the row's height never changes.
  boxDown: {
    marginTop: LIP - LIP_PRESSED,
    height: BOX_SIZE - (LIP - LIP_PRESSED),
    borderBottomWidth: LIP_PRESSED,
  },
  boxPicked: {
    backgroundColor: colors.primary.blue500,
    borderColor: colors.primary.blue500,
    borderBottomColor: colors.primary.blue700,
  },
  boxDisabled: {
    backgroundColor: colors.neutral[100],
    borderBottomColor: colors.border.subtle,
  },
  choiceLabel: {
    ...typography.body.medium,
    flex: 1,
    color: colors.text.primary,
  },
  choiceLabelPicked: { fontFamily: fonts.semibold },
  choiceLabelDisabled: { color: colors.text.tertiary },
  lipRow: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.medium,
    borderWidth: 2,
    borderBottomWidth: LIP,
    borderColor: colors.border.subtle,
    borderBottomColor: colors.border.default,
    backgroundColor: colors.background.card,
  },
  lipRowDown: {
    marginTop: LIP - LIP_PRESSED,
    minHeight: 56 - (LIP - LIP_PRESSED),
    borderBottomWidth: LIP_PRESSED,
  },
  lipRowOpen: {
    backgroundColor: colors.surface.selected,
    borderColor: colors.primary.blue500,
    borderBottomColor: colors.primary.blue500,
  },
  lipRowLabel: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  lipRowLabelOpen: { color: colors.primary.blue500 },
  slots: { gap: spacing.sm },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: SLOT_HEIGHT,
    paddingVertical: spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: colors.border.subtle,
  },
  slotNumber: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.primary.blue500,
    width: spacing.lg,
  },
  slotLine: { flex: 1 },
  slotText: {
    ...typography.body.medium,
    color: colors.text.primary,
  },
  bank: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.small,
    borderWidth: 2,
    borderBottomWidth: LIP,
    borderColor: colors.border.subtle,
    borderBottomColor: colors.border.default,
    backgroundColor: colors.background.card,
  },
  chipDown: {
    marginTop: LIP - LIP_PRESSED,
    borderBottomWidth: LIP_PRESSED,
  },
  chipUsed: {
    backgroundColor: colors.neutral[100],
    borderColor: colors.neutral[100],
    borderBottomColor: colors.neutral[100],
  },
  chipMiss: {
    ...StyleSheet.absoluteFillObject,
    margin: -2,
    borderRadius: radius.small,
    borderWidth: 2,
    borderColor: colors.error[500],
    backgroundColor: colors.error[100],
  },
  chipLabel: {
    ...typography.body.medium,
    color: colors.text.primary,
  },
  // A placed chip keeps its size as an empty shell.
  chipLabelUsed: { opacity: 0 },
});
