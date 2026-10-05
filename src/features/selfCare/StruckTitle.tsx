import { useState } from 'react';
import {
  type StyleProp,
  StyleSheet,
  type TextLayoutLine,
  type TextStyle,
  View,
} from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Text } from '../../components/common/Text';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';

const STRIKE_HEIGHT = 2;

interface Props {
  title: string;
  numberOfLines: number;
  style: StyleProp<TextStyle>;
  /** 0 is untouched, 1 is struck through every line */
  progress: SharedValue<number>;
  /** whether the title can be struck yet; the greyed copy is only built then */
  inked: boolean;
}

interface StrikeLineProps {
  line: TextLayoutLine;
  index: number;
  count: number;
  progress: SharedValue<number>;
}

function linesKey(lines: TextLayoutLine[]): string {
  return lines.map((line) => `${line.x},${line.y},${line.width}`).join('|');
}

/**
 * A title with a line drawn through it one wrapped line after another, the
 * way a pen crosses out a note, instead of a strikethrough that is simply on.
 * The ink greys with the same progress, so the text never changes a frame
 * ahead of or behind the line.
 *
 * The grey is a second copy of the title faded in over the first, not an
 * animated text colour. Reanimated cannot apply a colour on iOS without a
 * layout pass and a text re-measure, which it skips whenever React is
 * committing — so every tick's fade cost the whole screen a frame's work and
 * stuttered, and a run of ticks slowed every animation on it. An opacity is
 * applied directly every frame.
 */
export default function StruckTitle({
  title,
  numberOfLines,
  style,
  progress,
  inked,
}: Props) {
  const [lines, setLines] = useState<TextLayoutLine[]>([]);
  const shown = lines.slice(0, numberOfLines);
  const inkStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <View>
      <Text
        numberOfLines={numberOfLines}
        style={[style, styles.fresh]}
        onTextLayout={(event) => {
          const next = event.nativeEvent.lines;
          setLines((current) =>
            linesKey(current) === linesKey(next) ? current : next,
          );
        }}
      >
        {title}
      </Text>
      {inked ? (
        <Animated.Text
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          allowFontScaling={false}
          numberOfLines={numberOfLines}
          style={[{ fontFamily: fonts.regular }, style, styles.struck, inkStyle]}
        >
          {title}
        </Animated.Text>
      ) : null}
      {inked ? shown.map((line, index) => (
        <StrikeLine
          key={index}
          line={line}
          index={index}
          count={shown.length}
          progress={progress}
        />
      )) : null}
    </View>
  );
}

function StrikeLine({ line, index, count, progress }: StrikeLineProps) {
  // Scaled from its left end rather than widened: a width is layout, redone on
  // every frame of every tick, and in a quick run of ticks that layout was the
  // UI thread's work instead of drawing.
  const animatedStyle = useAnimatedStyle(() => {
    const own = Math.min(Math.max(progress.value * count - index, 0), 1);
    return { transform: [{ scaleX: own }] };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.line,
        {
          left: line.x,
          top: line.y + (line.height - STRIKE_HEIGHT) / 2,
          width: line.width,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  fresh: {
    color: colors.text.primary,
  },
  // Laid over the title exactly: same text, same width, same wrapping.
  struck: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    color: colors.text.tertiary,
  },
  line: {
    position: 'absolute',
    transformOrigin: 'left',
    height: STRIKE_HEIGHT,
    borderRadius: STRIKE_HEIGHT / 2,
    backgroundColor: colors.text.tertiary,
  },
});
