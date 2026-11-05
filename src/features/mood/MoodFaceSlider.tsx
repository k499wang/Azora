import { useEffect, useMemo, useRef, useState } from 'react';
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
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import CuteMoodFace, { moodAccent } from './CuteMoodFace';
import {
  MOOD_FACES,
  MOOD_SCALE_MAX,
  MOOD_SCALE_MIN,
  type MoodQuestion,
} from './domain/moodCheckIn';

/** How long a released answer is held before the page moves on. */
export const MOOD_SELECT_SETTLE_MS = 200;

const FACE_SIZE = 190;
const THUMB_SIZE = 36;
const THUMB_LIP = 4;
const THUMB_GRAB_SCALE = 1.1;
const RAIL_HEIGHT = 14;
const TICK_SIZE = 6;
const GRAB_SPRING = { damping: 15, stiffness: 320 };
const TRACK_HEIGHT = THUMB_SIZE + THUMB_LIP + spacing.md;
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
 * One drag across the scale. The face follows the thumb continuously, its word
 * sits beneath it, and the answer is given when it is let go.
 */
export default function MoodFaceSlider({ question, value, onChange, onGrab, mood }: Props) {
  const [width, setWidth] = useState(0);
  const [rating, setRating] = useState(value ?? START_RATING);
  const answered = value != null;
  const x = useSharedValue(0);
  const grabbed = useSharedValue(0);
  const travel = Math.max(width - THUMB_SIZE, 0);
  const segment = travel / STEPS;
  // Where the thumb was let go, 0 to 1, so it stays there rather than jumping
  // to the nearest point once the answer is stored.
  const released = useRef(((value ?? START_RATING) - MOOD_SCALE_MIN) / STEPS);

  useEffect(() => {
    x.value = released.current * travel;
  }, [travel, x]);

  const release = (fraction: number) => {
    released.current = fraction;
  };

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
        grabbed.value = withSpring(1, GRAB_SPRING);
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
        grabbed.value = withSpring(0, GRAB_SPRING);
        const settled = ratingAt(x.value);
        if (travel > 0) runOnJS(release)(x.value / travel);
        runOnJS(moveTo)(settled);
        runOnJS(onChange)(settled);
      });
  }, [grabbed, mood, onChange, onGrab, segment, travel, x]);

  const progress = useDerivedValue(() => (travel > 0 ? x.value / travel : 0.5));
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { scale: 1 + (THUMB_GRAB_SCALE - 1) * grabbed.value },
    ],
  }));
  const thumbFaceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: THUMB_LIP * grabbed.value }],
  }));
  const fillStyle = useAnimatedStyle(() => ({
    width: x.value + THUMB_SIZE / 2,
    backgroundColor: moodAccent(progress.value),
  }));

  const label = question.labels[rating - MOOD_SCALE_MIN];

  const step = (by: number) => {
    const next = Math.min(Math.max(rating + by, MOOD_SCALE_MIN), MOOD_SCALE_MAX);
    release((next - MOOD_SCALE_MIN) / STEPS);
    x.value = released.current * travel;
    moveTo(next);
    onChange(next);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.faceSlot}>
        <CuteMoodFace progress={progress} size={FACE_SIZE} />
      </View>

      <Text style={[styles.label, answered && styles.labelAnswered]} numberOfLines={1}>
        {label}
      </Text>

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
          <View style={styles.rail}>
            <Animated.View style={[styles.railFill, fillStyle]} />
          </View>
          {MOOD_FACES.map((face, index) => (
            <View
              key={face}
              style={[styles.tick, { left: THUMB_SIZE / 2 - TICK_SIZE / 2 + index * segment }]}
              pointerEvents="none"
            />
          ))}
          <Animated.View style={[styles.thumb, thumbStyle]} pointerEvents="none">
            <Animated.View style={[styles.thumbFace, thumbFaceStyle]} />
          </Animated.View>
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
  label: {
    ...typography.title.title2,
    textAlign: 'center',
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  labelAnswered: {
    color: colors.text.primary,
  },
  track: {
    height: TRACK_HEIGHT,
    justifyContent: 'center',
  },
  rail: {
    height: RAIL_HEIGHT,
    borderRadius: RAIL_HEIGHT / 2,
    overflow: 'hidden',
    backgroundColor: colors.background.card,
  },
  railFill: {
    height: '100%',
  },
  tick: {
    position: 'absolute',
    top: (TRACK_HEIGHT - TICK_SIZE) / 2,
    width: TICK_SIZE,
    height: TICK_SIZE,
    borderRadius: TICK_SIZE / 2,
    backgroundColor: colors.neutral[300],
  },
  thumb: {
    position: 'absolute',
    left: 0,
    top: (TRACK_HEIGHT - THUMB_SIZE - THUMB_LIP) / 2,
    width: THUMB_SIZE,
    height: THUMB_SIZE + THUMB_LIP,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.neutral[300],
  },
  thumbFace: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.background.card,
  },
  ends: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  endLabel: {
    ...typography.body.small,
    color: colors.text.tertiary,
  },
});
