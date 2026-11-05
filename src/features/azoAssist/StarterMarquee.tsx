import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import { Rise } from '../../components/common/Reveal';
import { Text } from '../../components/common/Text';
import { useWhileVisible } from '../../hooks/useWhileVisible';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { stagger } from '../../theme/motion';
import { pressable } from '../../theme/pressable';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

const POINTS_PER_SECOND = 22;
const FLING_DECAY_SECONDS = 0.5;
const SWIPE_SLOP = 10;
const PILL_HEIGHT = 34;

interface StarterMarqueeProps {
  rows: readonly (readonly string[])[];
  /** ms before the first row arrives */
  delay: number;
  onPick: (starter: string) => void;
}

/** Rows of starter pills drifting in alternating directions; a finger can hold or fling each row. */
export default function StarterMarquee({ rows, delay, onPick }: StarterMarqueeProps) {
  return (
    <View>
      {rows.map((starters, index) => (
        <Rise key={starters[0]} delay={delay + stagger.tight * index}>
          <StarterRow starters={starters} reverse={index % 2 === 1} onPick={onPick} />
        </Rise>
      ))}
    </View>
  );
}

interface StarterRowProps {
  starters: readonly string[];
  reverse: boolean;
  onPick: (starter: string) => void;
}

function StarterRow({ starters, reverse, onPick }: StarterRowProps) {
  const drift = reverse ? POINTS_PER_SECOND : -POINTS_PER_SECOND;
  const loopWidth = useSharedValue(0);
  const offset = useSharedValue(0);
  const velocity = useSharedValue(drift);
  const held = useSharedValue(false);

  // One clock for drift and fling: a released row coasts, then eases back into its drift.
  const frame = useFrameCallback(({ timeSincePreviousFrame }) => {
    if (held.value || !timeSincePreviousFrame) return;
    const seconds = timeSincePreviousFrame / 1000;
    velocity.value = drift + (velocity.value - drift) * Math.exp(-seconds / FLING_DECAY_SECONDS);
    offset.value += velocity.value * seconds;
  }, false);

  useWhileVisible(() => {
    frame.setActive(true);
    return () => frame.setActive(false);
  }, [frame]);

  const swipe = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-SWIPE_SLOP, SWIPE_SLOP])
        .failOffsetY([-SWIPE_SLOP, SWIPE_SLOP])
        .onBegin(() => {
          held.value = true;
          velocity.value = 0;
        })
        .onChange((event) => {
          offset.value += event.changeX;
        })
        .onEnd((event) => {
          velocity.value = event.velocityX;
        })
        .onFinalize(() => {
          held.value = false;
        }),
    [held, offset, velocity],
  );

  const slide = useAnimatedStyle(() => {
    const width = loopWidth.value;
    if (width === 0) return { transform: [{ translateX: 0 }] };
    return { transform: [{ translateX: ((offset.value % width) + width) % width - width }] };
  });

  return (
    <GestureDetector gesture={swipe}>
      {/* Locked ScrollView: a plain row would cap the track at the screen width and break the loop measure. */}
      <ScrollView
        horizontal
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.rowContent}
      >
        <Animated.View style={[styles.track, slide]}>
          <View
            style={styles.set}
            onLayout={(event) => {
              loopWidth.value = event.nativeEvent.layout.width;
            }}
          >
            {starters.map((starter) => <StarterPill key={starter} starter={starter} onPick={onPick} />)}
          </View>
          <View style={styles.set} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {starters.map((starter) => <StarterPill key={starter} starter={starter} onPick={onPick} />)}
          </View>
        </Animated.View>
      </ScrollView>
    </GestureDetector>
  );
}

function StarterPill({ starter, onPick }: { starter: string; onPick: (starter: string) => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={spacing.xs}
      onPress={() => onPick(starter)}
      style={({ pressed }) => [card.base, card.shadowSubtle, styles.pill, pressed && pressable.control]}
    >
      <Text style={styles.pillText} numberOfLines={1}>{starter}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // The vertical padding leaves the pills' shadows room inside the row's clip.
  rowContent: { paddingVertical: spacing.xs },
  track: { flexDirection: 'row' },
  set: { flexDirection: 'row', gap: spacing.sm, paddingRight: spacing.sm },
  pill: {
    height: PILL_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
  },
  pillText: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
});
