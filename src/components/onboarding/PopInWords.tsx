import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View, type StyleProp, type TextStyle } from 'react-native';
import { Text } from '../common/Text';
import { spacing } from '../../theme/spacing';
import { duration, spring, stagger, travel } from '../../theme/motion';

interface PopInWordsProps {
  text: string;
  /** Phrases of `text` drawn in `highlightStyle`, across word breaks if need be. */
  highlights?: readonly string[];
  highlightStyle?: StyleProp<TextStyle>;
  accessibilityRole?: 'header' | 'text';
  /** Holds every word back until the screen it plays over has painted. */
  play: boolean;
  reducedMotion: boolean;
  textStyle: StyleProp<TextStyle>;
}

/** How small a word starts before it pops up to full size. */
const WORD_START_SCALE = 0.6;

/** The tilt each word springs upright from, alternating side to side. */
const WORD_TILT = 7;

interface WordRun {
  text: string;
  highlighted: boolean;
}

interface WordProps {
  runs: readonly WordRun[];
  index: number;
  play: boolean;
  reducedMotion: boolean;
  textStyle: StyleProp<TextStyle>;
  highlightStyle: StyleProp<TextStyle>;
}

/** Each word of `text`, cut into runs where a highlighted phrase starts or ends. */
function splitWords(text: string, highlights: readonly string[]): WordRun[][] {
  const lit = new Array<boolean>(text.length).fill(false);
  for (const phrase of highlights) {
    const start = text.indexOf(phrase);
    if (start < 0) continue;
    lit.fill(true, start, start + phrase.length);
  }
  const words: WordRun[][] = [];
  let offset = 0;
  for (const word of text.split(' ')) {
    const runs: WordRun[] = [];
    for (let i = 0; i < word.length; i += 1) {
      const highlighted = lit[offset + i];
      const last = runs[runs.length - 1];
      if (last && last.highlighted === highlighted) last.text += word[i];
      else runs.push({ text: word[i], highlighted });
    }
    words.push(runs);
    offset += word.length + 1;
  }
  return words;
}

// Core Animated rather than Reanimated: the screen re-renders on every entrance
// phase, and with the sync-UI-props flags a Reanimated view is handed its
// first-render style again — opacity 0 — which blanked a line already read.
function Word({ runs, index, play, reducedMotion, textStyle, highlightStyle }: WordProps) {
  const arrival = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reducedMotion) {
      arrival.setValue(1);
      return;
    }
    if (!play) return;
    const pop = Animated.sequence([
      Animated.delay(duration.fast + index * stagger.base),
      Animated.spring(arrival, { toValue: 1, ...spring.pop, useNativeDriver: true, isInteraction: false }),
    ]);
    pop.start();
    return () => {
      pop.stop();
      arrival.setValue(1);
    };
  }, [arrival, index, play, reducedMotion]);

  const tilt = index % 2 === 0 ? -WORD_TILT : WORD_TILT;
  const style = useMemo(
    () => ({
      opacity: arrival.interpolate({ inputRange: [0, 0.4], outputRange: [0, 1], extrapolate: 'clamp' }),
      transform: [
        { translateY: arrival.interpolate({ inputRange: [0, 1], outputRange: [travel.drop, 0] }) },
        { rotate: arrival.interpolate({ inputRange: [0, 1], outputRange: [`${tilt}deg`, '0deg'] }) },
        { scale: arrival.interpolate({ inputRange: [0, 1], outputRange: [WORD_START_SCALE, 1] }) },
      ],
    }),
    [arrival, tilt],
  );

  return (
    <Animated.View style={style}>
      <Text style={textStyle}>
        {runs.map((run, runIndex) =>
          run.highlighted ? <Text key={runIndex} style={[textStyle, highlightStyle]}>{run.text}</Text> : run.text,
        )}
      </Text>
    </Animated.View>
  );
}

/** A line that pops up a word at a time, each with a small springy tilt. */
export default function PopInWords({
  text,
  highlights = [],
  highlightStyle,
  accessibilityRole = 'text',
  play,
  reducedMotion,
  textStyle,
}: PopInWordsProps) {
  const words = useMemo(() => splitWords(text, highlights), [text, highlights]);
  return (
    <View style={styles.row} accessible accessibilityRole={accessibilityRole} accessibilityLabel={text}>
      {words.map((runs, index) => (
        <Word
          key={index}
          runs={runs}
          index={index}
          play={play}
          reducedMotion={reducedMotion}
          textStyle={textStyle}
          highlightStyle={highlightStyle}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: spacing.sm },
});
