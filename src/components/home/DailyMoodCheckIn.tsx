import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { card } from '../../theme/card';

export type MoodValue = 1 | 2 | 3 | 4 | 5;

interface MoodOption {
  value: MoodValue;
  emoji: string;
  label: string;
}

const MOODS: MoodOption[] = [
  { value: 1, emoji: '😣', label: 'Rough' },
  { value: 2, emoji: '😕', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
];

interface DailyMoodCheckInProps {
  selected?: MoodValue | null;
  onSelect?: (value: MoodValue) => void;
}

export default function DailyMoodCheckIn({ selected = null, onSelect }: DailyMoodCheckInProps) {
  const [localSelected, setLocalSelected] = useState<MoodValue | null>(selected);
  const active = selected ?? localSelected;

  const handleSelect = (value: MoodValue) => {
    setLocalSelected(value);
    onSelect?.(value);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.prompt}>How are you feeling?</Text>
      <View style={styles.row}>
        {MOODS.map((mood) => {
          const isActive = active === mood.value;
          return (
            <Pressable
              key={mood.value}
              onPress={() => handleSelect(mood.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={mood.label}
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}
            >
              <View style={[styles.emojiWrap, isActive && styles.emojiWrapActive]}>
                <Text style={styles.emoji}>{mood.emoji}</Text>
              </View>
              <Text style={[styles.label, isActive && styles.labelActive]} numberOfLines={1}>
                {mood.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...card.base,
    ...card.shadow,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  prompt: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.6,
  },
  emojiWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: 'transparent',
  },
  emojiWrapActive: {
    backgroundColor: colors.background.accentSoft,
    borderColor: colors.primary.blue300,
  },
  emoji: {
    fontSize: 26,
  },
  label: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
  },
  labelActive: {
    color: colors.text.brand,
  },
});
