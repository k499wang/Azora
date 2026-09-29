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
 */
export default function StruckTitle({
  title,
  numberOfLines,
  style,
  progress,
}: Props) {
  const [lines, setLines] = useState<TextLayoutLine[]>([]);
  const shown = lines.slice(0, numberOfLines);

  return (
    <View>
      <Text
        numberOfLines={numberOfLines}
        style={style}
        onTextLayout={(event) => {
          const next = event.nativeEvent.lines;
          setLines((current) =>
            linesKey(current) === linesKey(next) ? current : next,
          );
        }}
      >
        {title}
      </Text>
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
  const animatedStyle = useAnimatedStyle(() => {
    const own = Math.min(Math.max(progress.value * count - index, 0), 1);
    return { width: line.width * own };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.line,
        { left: line.x, top: line.y + (line.height - STRIKE_HEIGHT) / 2 },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  line: {
    position: 'absolute',
    height: STRIKE_HEIGHT,
    borderRadius: STRIKE_HEIGHT / 2,
    backgroundColor: colors.text.tertiary,
  },
});
