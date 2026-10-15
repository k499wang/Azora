import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { Text } from '../../components/common/Text';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts } from '../../theme/typography';
import CuteMoodFace from './CuteMoodFace';
import {
  MOOD_FACES,
  MOOD_SCALE_MAX,
  MOOD_SCALE_MIN,
  type MoodQuestion,
} from './domain/moodCheckIn';

/** How long the thumb takes to snap onto a point after release. */
export const MOOD_SELECT_SETTLE_MS = 200;

const FACE_SIZE = 210;
const THUMB_SIZE = 26;
const TRACK_HEIGHT = 22;
const BUBBLE_WIDTH = 96;
const BUBBLE_TAIL = 8;
const SNAP_SPRING = { damping: 26, stiffness: 260, overshootClamping: true } as const;
const STEPS = MOOD_FACES.length - 1;
const START_RATING = Math.ceil((MOOD_SCALE_MIN + MOOD_SCALE_MAX) / 2);

interface Props {
  question: MoodQuestion;
  value: number | null;
  /** On release, with the point the thumb settled on. */
  onChange: (rating: number) => void;
  /** On touch, so a pending page turn can wait for the new answer. */
  onGrab?: () => void;
  /** Written while dragging, 0 to 1, for a page that wants to follow the mood. */
  mood?: SharedValue<number>;
}

/**
 * One drag across the scale. The face follows the thumb continuously, the word
 * rides above it in a bubble, and the answer is given when it is let go.
 */
export default function MoodFaceSlider({ question, value, onChange, onGrab, mood }: Props) {
  const [width, setWidth] = useState(0);
  const [rating, setRating] = useState(value ?? START_RATING);
  const answered = value != null;
  const x = useSharedValue(0);
  const travel = Math.max(width - THUMB_SIZE, 0);
  const segment = travel / STEPS;

  useEffect(() => {
    x.value = ((value ?? START_RATING) - MOOD_SCALE_MIN) * segment;
  }, [segment, value, x]);

  const moveTo = (next: number) => {
    setRating((current) => {
      if (current !== next) triggerTapHaptic();
      return next;
    });
  };

  const gesture = useMemo(() => {
    const ratingAt = (position: number) => {
      'worklet';
      if (segment <= 0) return START_RATING;
      return MOOD_SCALE_MIN + Math.round(position / segment);
    };
    const clamp = (position: number) => {
      'worklet';
      return Math.min(Math.max(position - THUMB_SIZE / 2, 0), travel);
    };
    const follow = () => {
      'worklet';
      if (mood && travel > 0) mood.value = x.value / travel;
    };
    return Gesture.Pan()
      .minDistance(0)
      .onBegin((event) => {
        x.value = clamp(event.x);
        follow();
        if (onGrab) runOnJS(onGrab)();
        runOnJS(moveTo)(ratingAt(x.value));
      })
      .onUpdate((event) => {
        x.value = clamp(event.x);
        follow();
        runOnJS(moveTo)(ratingAt(x.value));
      })
      .onFinalize(() => {
        const settled = ratingAt(x.value);
        x.value = withSpring((settled - MOOD_SCALE_MIN) * segment, SNAP_SPRING);
        if (mood && travel > 0) {
          mood.value = withSpring(((settled - MOOD_SCALE_MIN) * segment) / travel, SNAP_SPRING);
        }
        runOnJS(moveTo)(settled);
        runOnJS(onChange)(settled);
      });
  }, [mood, onChange, onGrab, segment, travel, x]);

  const progress = useDerivedValue(() => (travel > 0 ? x.value / travel : 0.5));
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));
  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: Math.min(
          Math.max(x.value + THUMB_SIZE / 2 - BUBBLE_WIDTH / 2, -spacing.md),
          width - BUBBLE_WIDTH + spacing.md,
        ),
      },
    ],
  }));

  const label = question.labels[rating - MOOD_SCALE_MIN];

  const step = (by: number) => {
    const next = Math.min(Math.max(rating + by, MOOD_SCALE_MIN), MOOD_SCALE_MAX);
    moveTo(next);
    onChange(next);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.faceSlot}>
        <CuteMoodFace progress={progress} size={FACE_SIZE} />
      </View>

      <View style={styles.bubbleRow} pointerEvents="none">
        <Animated.View style={[styles.bubble, bubbleStyle]}>
          <View style={styles.bubbleBody}>
            <Text style={[styles.label, answered && styles.labelAnswered]} numberOfLines={1}>
              {label}
            </Text>
          </View>
          <View style={styles.bubbleTail} />
        </Animated.View>
      </View>

      <GestureDetector gesture={gesture}>
        <View
          style={styles.track}
          onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={question.question}
          accessibilityValue={{ text: label }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(event) =>
            step(event.nativeEvent.actionName === 'increment' ? 1 : -1)
          }
        >
          <View style={styles.rail} />
          <Animated.View
            style={[styles.thumb, thumbStyle]}
            pointerEvents="none"
          />
        </View>
      </GestureDetector>

      <View style={styles.ends} pointerEvents="none">
        <Text style={styles.endLabel}>{question.labels[0]}</Text>
        <Text style={styles.endLabel}>{question.labels[STEPS]}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  faceSlot: {
    height: FACE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  bubbleRow: {
    height: 36 + BUBBLE_TAIL,
  },
  bubble: {
    position: 'absolute',
    left: 0,
    width: BUBBLE_WIDTH,
    alignItems: 'center',
  },
  bubbleBody: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    backgroundColor: colors.background.card,
  },
  bubbleTail: {
    width: BUBBLE_TAIL * 1.6,
    height: BUBBLE_TAIL * 1.6,
    marginTop: -BUBBLE_TAIL,
    borderRadius: 3,
    transform: [{ rotate: '45deg' }],
    backgroundColor: colors.background.card,
  },
  label: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
  },
  labelAnswered: {
    color: colors.text.primary,
  },
  track: {
    height: THUMB_SIZE + spacing.md,
    justifyContent: 'center',
  },
  rail: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: colors.background.card,
  },
  thumb: {
    ...card.shadow,
    position: 'absolute',
    left: 0,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 4,
    borderColor: colors.background.card,
    backgroundColor: colors.text.primary,
  },
  ends: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  endLabel: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
  },
});
