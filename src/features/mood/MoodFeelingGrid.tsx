/**
 * Which word fits best, as a wrap of chips.
 *
 * One tap answers and moves on, like the faces: it is one choice, not a list
 * to build. "Not sure" is always there and is as easy to tap as any word,
 * because a label somebody was pushed into is worse than none.
 */
import { StyleSheet, View } from 'react-native';
import MoodChip from './MoodChip';
import type { MoodFeeling } from './domain/moodFeelings';
import { spacing } from '../../theme/spacing';

interface MoodFeelingGridProps {
  words: readonly MoodFeeling[];
  /** The word picked, null for "Not sure", undefined before either. */
  value: string | null | undefined;
  onChange: (feeling: string | null) => void;
}

export default function MoodFeelingGrid({
  words,
  value,
  onChange,
}: MoodFeelingGridProps) {
  return (
    <View style={styles.grid}>
      {words.map((word) => (
        <MoodChip
          key={word.id}
          label={word.label}
          icon={word.icon}
          chosen={value === word.id}
          accessibilityRole="radio"
          onPress={() => onChange(word.id)}
        />
      ))}
      <MoodChip
        label="Not sure"
        icon="question"
        chosen={value === null}
        accessibilityRole="radio"
        onPress={() => onChange(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
