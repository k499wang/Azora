/**
 * One chip in the check-in's wraps: the tags and the feeling words.
 *
 * Shared so the two pages look like one screen. Picking a word and picking a
 * tag are different decisions, but a chip that looked different on the next
 * page would read as a different kind of thing to tap.
 */
import type { AccessibilityRole } from 'react-native';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import type { IconName } from '../../components/common/icons/paths';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

const CHIP_ICON = 18;

interface MoodChipProps {
  label: string;
  icon?: IconName;
  chosen: boolean;
  disabled?: boolean;
  accessibilityRole: AccessibilityRole;
  onPress: () => void;
}

export default function MoodChip({
  label,
  icon,
  chosen,
  disabled = false,
  accessibilityRole,
  onPress,
}: MoodChipProps) {
  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityState={
        accessibilityRole === 'radio'
          ? { selected: chosen, disabled }
          : { checked: chosen, disabled }
      }
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => {
        triggerTapHaptic();
        onPress();
      }}
      style={({ pressed }) => [
        styles.chip,
        chosen && styles.chipChosen,
        disabled && styles.chipDisabled,
        pressed && styles.chipPressed,
      ]}
    >
      {icon != null ? (
        <Icon
          name={icon}
          size={CHIP_ICON}
          color={chosen ? colors.playful.sky.ink : colors.text.tertiary}
        />
      ) : null}
      <Text style={[styles.label, chosen && styles.labelChosen]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderCurve: 'continuous',
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  chipChosen: {
    backgroundColor: colors.playful.sky.soft,
    borderColor: colors.playful.sky.base,
  },
  chipDisabled: {
    opacity: 0.45,
  },
  chipPressed: {
    opacity: 0.7,
  },
  label: {
    ...typography.label.large,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
  },
  labelChosen: {
    color: colors.playful.sky.ink,
  },
});
