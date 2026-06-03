import type { ReactNode } from 'react';
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
import GlassSurface from '../common/GlassSurface';
import { DEFAULT_CARD_SURFACE } from '../common/cardSurfaceConfig';

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
          <MoodChipSurface>
            <MaterialCommunityIcons
              name={mood.icon}
              size={26}
              color={colors.primary.blue600}
            />
            <Text style={styles.label}>{mood.label}</Text>
          </MoodChipSurface>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function MoodChipSurface({ children }: { children: ReactNode }) {
  if (DEFAULT_CARD_SURFACE === 'glass') {
    return (
      <GlassSurface
        bare
        interactive
        style={styles.chipSurface}
        blurColor={colors.glass.fill}
        solidColor={colors.glass.scrim}
      >
        {children}
      </GlassSurface>
    );
  }

  return <View style={[styles.chipSurface, styles.solidChipSurface]}>{children}</View>;
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: padding.screen.horizontal,
    gap: spacing.sm,
  },
  chip: {
    borderRadius: 999,
  },
  chipSurface: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glass.edge,
    overflow: 'hidden',
  },
  solidChipSurface: {
    backgroundColor: colors.background.elevated,
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
