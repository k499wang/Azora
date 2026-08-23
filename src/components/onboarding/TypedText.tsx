import { useEffect, useState } from 'react';
import { StyleSheet, View, type StyleProp, type TextStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { Text } from '../common/Text';

interface TypedTextProps {
  text: string;
  style?: StyleProp<TextStyle>;
  /** ms per character */
  speed?: number;
  delay?: number;
}

const DEFAULT_SPEED_MS = 32;

/**
 * Text that types itself in.
 *
 * The full string is rendered underneath at zero opacity so the block reserves
 * its final height from the first frame. Without it every new character can
 * rewrap the paragraph and shove the rest of the screen down, which reads as a
 * layout bug rather than as typing.
 *
 * Character count is React state rather than an animated value because the
 * effect *is* a change of content — there is nothing for the UI thread to
 * interpolate.
 */
export default function TypedText({
  text,
  style,
  speed = DEFAULT_SPEED_MS,
  delay = 0,
}: TypedTextProps) {
  const reducedMotion = useReducedMotion();
  const [count, setCount] = useState(reducedMotion ? text.length : 0);

  useEffect(() => {
    if (reducedMotion) {
      setCount(text.length);
      return;
    }

    setCount(0);
    let typed = 0;
    let interval: ReturnType<typeof setInterval> | null = null;

    const start = setTimeout(() => {
      interval = setInterval(() => {
        typed += 1;
        setCount(typed);
        if (typed >= text.length && interval != null) {
          clearInterval(interval);
          interval = null;
        }
      }, speed);
    }, delay);

    return () => {
      clearTimeout(start);
      if (interval != null) clearInterval(interval);
    };
  }, [delay, reducedMotion, speed, text]);

  return (
    <View>
      <Text
        style={[style, styles.reserve]}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        {text}
      </Text>
      <View style={StyleSheet.absoluteFill}>
        <Text style={style} accessibilityLabel={text}>
          {text.slice(0, count)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  reserve: { opacity: 0 },
});
