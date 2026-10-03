import { useState } from 'react';
import {
  type StyleProp,
  StyleSheet,
  type TextLayoutLine,
  type TextStyle,
  View,
} from 'react-native';
import Animated, {
  interpolateColor,
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';

const STRIKE_HEIGHT = 2;

interface Props {
  title: string;
  numberOfLines: number;
  style: StyleProp<TextStyle>;
  /** 0 is untouched, 1 is struck through every line */
  progress: SharedValue<number>;
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
 */
export default function StruckTitle({
  title,
  numberOfLines,
  style,
  progress,
}: Props) {
  const [lines, setLines] = useState<TextLayoutLine[]>([]);
  const shown = lines.slice(0, numberOfLines);
  const inkStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      [colors.text.primary, colors.text.tertiary],
    ),
  }));

  return (
    <View>
      <Animated.Text
        allowFontScaling={false}
        numberOfLines={numberOfLines}
        style={[{ fontFamily: fonts.regular }, style, inkStyle]}
        onTextLayout={(event) => {
          const next = event.nativeEvent.lines;
          setLines((current) =>
            linesKey(current) === linesKey(next) ? current : next,
          );
        }}
      >
        {title}
      </Animated.Text>
      {shown.map((line, index) => (
        <StrikeLine
          key={index}
          line={line}
          index={index}
          count={shown.length}
          progress={progress}
        />
      ))}
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
  line: {
    position: 'absolute',
    transformOrigin: 'left',
    height: STRIKE_HEIGHT,
    borderRadius: STRIKE_HEIGHT / 2,
    backgroundColor: colors.text.tertiary,
  },
});
