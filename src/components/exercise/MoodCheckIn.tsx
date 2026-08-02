import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Text } from '../common/Text';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { card } from '../../theme/card';
import {
  POST_SESSION_MOODS,
  type PostSessionMood,
} from '../../data/postSessionMoods';

interface Props {
  onSelect: (mood: PostSessionMood) => void;
}

export default function MoodCheckIn({ onSelect }: Props) {
  const [selectedId, setSelectedId] = useState<PostSessionMood['id'] | null>(
    null,
  );

  const handlePress = (mood: PostSessionMood) => {
    if (selectedId === mood.id) return;
    setSelectedId(mood.id);
    Haptics.selectionAsync().catch(() => {});
    onSelect(mood);
  };

  return (
    <View style={[card.base, styles.container]}>
      <Text style={styles.prompt}>
        {selectedId == null ? 'How do you feel?' : 'Thanks for checking in'}
      </Text>

      <View style={styles.row}>
        {POST_SESSION_MOODS.map((mood) => {
          const selected = selectedId === mood.id;
          const dimmed = selectedId != null && !selected;

          return (
            <Pressable
              key={mood.id}
              onPress={() => handlePress(mood)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`I feel ${mood.label.toLowerCase()}`}
              style={({ pressed }) => [
                styles.chip,
                dimmed && styles.chipDimmed,
                pressed && styles.chipPressed,
              ]}
            >
              <View
                style={[
                  styles.iconWell,
                  selected && { backgroundColor: mood.accentColor },
                ]}
              >
                <MaterialCommunityIcons
                  name={mood.icon}
                  size={24}
                  color={selected ? colors.text.inverse : mood.accentColor}
                />
              </View>
              <Text style={[styles.label, selected && styles.labelSelected]}>
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
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  prompt: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  chipDimmed: {
    opacity: 0.45,
  },
  chipPressed: {
    transform: [{ scale: 0.96 }],
  },
  iconWell: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
  },
  label: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
  },
  labelSelected: {
    color: colors.text.primary,
  },
});
