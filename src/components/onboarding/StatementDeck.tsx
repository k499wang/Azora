import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Reanimated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '../common/Text';
import type { OnboardingOption } from './OnboardingOptionList';
import { card, radius } from '../../theme/card';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { colors } from '../../theme/colors';
import { duration, easing } from '../../theme/motion';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

const CARD_WIDTH_SHARE = 0.72;
const CARD_MAX_SIZE = 300;
const CARDS_BEHIND = 2;
const DEPTH_SCALE_STEP = 0.06;
const EXIT_ROTATION_DEG = 6;

type ExitDirection = -1 | 0 | 1;

/** No, neutral, yes: each answer keeps its own colour, picked or not. */
const ANSWER_TONES = [
  { fill: colors.playful.coral.soft, label: colors.playful.coral.ink },
  { fill: colors.neutral[200], label: colors.neutral[700] },
  { fill: colors.playful.teal.soft, label: colors.playful.teal.ink },
] as const;

interface StatementDeckProps<Id extends string> {
  statement: string;
  upcoming: string[];
  /** no, neutral, yes — in that order */
  options: OnboardingOption<Id>[];
  selectedId: Id | null;
  onAnswer: (id: Id) => void;
}

/**
 * The run of agree-or-disagree statements as one stack: answering throws the
 * top card off (left for no, up for neutral, right for yes) and the
 * next statement, already waiting underneath, steps forward.
 */
export default function StatementDeck<Id extends string>({
  statement,
  upcoming,
  options,
  selectedId,
  onAnswer,
}: StatementDeckProps<Id>) {
  const [throwing, setThrowing] = useState<{
    statement: string;
    id: Id;
    direction: ExitDirection;
  } | null>(null);
  const { width } = useWindowDimensions();
  const size = Math.min(width * CARD_WIDTH_SHARE, CARD_MAX_SIZE);
  // Tied to the card it was thrown from, so the card that steps up behind it
  // never inherits the throw and the answer is only ever sent once.
  const leaving = throwing?.statement === statement ? throwing : null;
  // The last throw empties the deck, so the answers leave with it and the next
  // screen arrives onto a clean page rather than cutting in under live buttons.
  const finalThrow = leaving != null && upcoming.length === 0;
  const answersOpacity = useSharedValue(1);

  useEffect(() => {
    answersOpacity.value = withTiming(finalThrow ? 0 : 1, {
      duration: duration.base,
      easing: finalThrow ? easing.exit : easing.enter,
    });
  }, [answersOpacity, finalThrow]);

  const answersStyle = useAnimatedStyle(() => ({ opacity: answersOpacity.value }));

  const stack = [statement, ...upcoming.slice(0, CARDS_BEHIND)];

  return (
    <View>
      <View style={[styles.deck, { height: size + CARDS_BEHIND * spacing.md }]}>
        {stack
          .map((text, depth) => (
            <StatementCard
              key={text}
              text={text}
              size={size}
              depth={depth}
              exitDirection={depth === 0 && leaving ? leaving.direction : null}
              onGone={() => {
                if (!leaving) return;
                setThrowing(null);
                onAnswer(leaving.id);
              }}
            />
          ))
          .reverse()}
      </View>
      <Reanimated.View style={[styles.answers, answersStyle]}>
        {options.map((option, index) => (
          <AnswerButton
            key={option.id}
            label={option.title}
            tone={ANSWER_TONES[index]}
            selected={(leaving?.id ?? selectedId) === option.id}
            onPress={() => {
              if (leaving) return;
              triggerTapHaptic();
              setThrowing({ statement, id: option.id, direction: (index - 1) as ExitDirection });
            }}
          />
        ))}
      </Reanimated.View>
    </View>
  );
}

interface AnswerButtonProps {
  label: string;
  tone: (typeof ANSWER_TONES)[number];
  selected: boolean;
  onPress: () => void;
}

function AnswerButton({ label, tone, selected, onPress }: AnswerButtonProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.answer,
        { backgroundColor: tone.fill },
        pressed && styles.answerPressed,
      ]}
    >
      <Text style={[styles.answerLabel, { color: tone.label }]}>
        {label}
      </Text>
    </Pressable>
  );
}

interface StatementCardProps {
  text: string;
  size: number;
  depth: number;
  exitDirection: ExitDirection | null;
  onGone: () => void;
}

function StatementCard({ text, size, depth, exitDirection, onGone }: StatementCardProps) {
  const { width } = useWindowDimensions();
  const depthProgress = useSharedValue(depth);
  const exitX = useSharedValue(0);
  const exitY = useSharedValue(0);
  const onGoneRef = useRef(onGone);
  onGoneRef.current = onGone;

  useEffect(() => {
    depthProgress.value = withTiming(depth, { duration: duration.base, easing: easing.settle });
  }, [depth, depthProgress]);

  useEffect(() => {
    if (exitDirection == null) return;
    const config = { duration: duration.base, easing: easing.exit };
    const gone = () => onGoneRef.current();
    const finish = (finished?: boolean) => {
      'worklet';
      if (finished) runOnJS(gone)();
    };
    if (exitDirection === 0) {
      exitY.value = withTiming(-size * 2, config, finish);
    } else {
      exitX.value = withTiming(exitDirection * width * 1.2, config, finish);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- a rotation mid-throw must not restart it
  }, [exitDirection]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: depthProgress.value * spacing.md + exitY.value },
      { translateX: exitX.value },
      { rotate: `${(exitX.value / width) * EXIT_ROTATION_DEG}deg` },
      { scale: 1 - depthProgress.value * DEPTH_SCALE_STEP },
    ],
    opacity: depthProgress.value > CARDS_BEHIND - 0.5 ? 0.6 : 1,
  }));

  return (
    <Reanimated.View style={[styles.card, { width: size, height: size }, animatedStyle]}>
      <Text style={styles.cardText}>“{text}”</Text>
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  deck: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  card: {
    ...card.base,
    ...card.shadow,
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  cardText: {
    ...typography.title.title3,
    color: colors.text.primary,
    textAlign: 'center',
  },
  answers: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  answer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.full,
  },
  answerPressed: {
    transform: [{ scale: 0.97 }],
  },
  answerLabel: {
    ...typography.body.medium,
    fontFamily: fonts.heavy,
  },
});
