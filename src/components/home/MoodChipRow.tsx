import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { usePostHog } from 'posthog-react-native';
import { colors } from '../../theme/colors';
import { fonts, typography } from '../../theme/typography';
import { spacing, padding } from '../../theme/spacing';
import { AnalyticsEvent } from '../../services/analytics/events';
import { MOODS, type Mood } from '../../data/moods';
import type { MainTabNavigationProp } from '../../app/navigation';

export default function MoodChipRow() {
  const navigation = useNavigation<MainTabNavigationProp<'Home'>>();
  const posthog = usePostHog();

  const handlePress = (mood: Mood) => {
    posthog.capture(AnalyticsEvent.DailyPlanStarted, {
      source: 'mood_chip',
      mood: mood.id,
      technique_id: mood.techniqueId,
    });
    navigation.navigate('ExerciseSession', { techniqueId: mood.techniqueId });
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {MOODS.map((mood) => (
        <Pressable
          key={mood.id}
          onPress={() => handlePress(mood)}
          style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Breathwork for ${mood.label.toLowerCase()}`}
        >
          <MaterialCommunityIcons
            name={mood.icon}
            size={26}
            color={colors.primary.blue600}
          />
          <Text style={styles.label}>{mood.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: padding.screen.horizontal,
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.92,
  },
  label: {
    ...typography.label.large,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
});
