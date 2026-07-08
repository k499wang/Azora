import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from '../../components/common/icons/Icon';
import { colors } from '../../theme/colors';
import {
  EXERCISE_DARK_THEMES,
  type ExerciseDarkTheme,
} from '../../theme/exerciseDarkThemes';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

interface ThemePickerSectionProps {
  activeThemeId: ExerciseDarkTheme['id'];
  onSelect: (theme: ExerciseDarkTheme) => void;
}

export default function ThemePickerSection({
  activeThemeId,
  onSelect,
}: ThemePickerSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>Color theme</Text>
      <Text style={styles.description}>Background palette for this session.</Text>

      <View style={styles.list}>
        {EXERCISE_DARK_THEMES.map((t) => {
          const selected = activeThemeId === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => onSelect(t)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={styles.row}
            >
              <View style={[styles.swatch, { backgroundColor: t.dotColor }]} />
              <Text style={[styles.label, selected && styles.labelSelected]}>
                {t.label}
              </Text>
              {selected ? (
                <Icon name="check" size={14} color={colors.primary.blue700} />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.lg,
  },
  title: {
    ...typography.heading.heading1,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  description: {
    ...typography.body.small,
    color: colors.text.secondary,
    marginTop: 2,
    marginBottom: spacing.sm + 2,
  },
  list: {
    gap: spacing.xs + 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    gap: spacing.sm,
  },
  swatch: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  label: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  labelSelected: {
    color: colors.primary.blue700,
  },
});
