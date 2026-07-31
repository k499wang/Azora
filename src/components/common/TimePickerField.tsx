import { Text } from './Text';
import { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTimePickerSheet } from './useTimePickerSheet';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

interface TimePickerFieldProps {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export default function TimePickerField({
  value,
  onChange,
  disabled = false,
  accessibilityLabel,
}: TimePickerFieldProps) {
  const { open, sheet } = useTimePickerSheet({
    value,
    onChange,
    disabled,
    title: 'Set reminder time',
  });

  const displayLabel = useMemo(() => formatTime(value), [value]);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? `Change time, currently ${displayLabel}`}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={open}
        style={({ pressed }) => [
          styles.pill,
          disabled && styles.pillDisabled,
          pressed && !disabled && styles.pillPressed,
        ]}
      >
        <Text style={styles.pillText}>{displayLabel}</Text>
        <MaterialCommunityIcons
          name="chevron-down"
          size={18}
          color={disabled ? colors.text.tertiary : colors.primary.blue700}
        />
      </Pressable>

      {sheet}
    </>
  );
}

function formatTime(value: string): string {
  const [hourRaw, minute] = value.split(':');
  const hour = Number(hourRaw);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute} ${suffix}`;
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 40,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primary.blue600,
    backgroundColor: colors.primary.blue100,
  },
  pillPressed: {
    opacity: 0.72,
  },
  pillDisabled: {
    borderColor: colors.border.default,
    backgroundColor: colors.background.elevated,
  },
  pillText: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.primary.blue700,
  },
});
