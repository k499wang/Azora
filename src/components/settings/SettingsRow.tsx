import { Text } from '../common/Text';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography, fonts } from '../../theme/typography';

interface SettingsRowProps {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress?: () => void;
  rightSlot?: ReactNode;
  showChevron?: boolean;
  destructive?: boolean;
  isLast?: boolean;
  centered?: boolean;
}

export default function SettingsRow({
  icon,
  label,
  onPress,
  rightSlot,
  showChevron = true,
  destructive,
  isLast,
  centered,
}: SettingsRowProps) {
  const tint = destructive ? colors.error[500] : colors.primary.blue600;
  const labelColor = destructive ? colors.error[500] : colors.text.primary;
  const disabled = onPress == null && rightSlot == null;

  const content = (
    <>
      {icon && !centered ? (
        <MaterialCommunityIcons name={icon} size={20} color={tint} />
      ) : null}
      <Text
        style={[
          styles.label,
          centered && styles.labelCentered,
          { color: labelColor },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {rightSlot ?? (
        showChevron && onPress && !centered ? (
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={colors.text.tertiary}
          />
        ) : null
      )}
    </>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.row,
        !isLast && styles.divider,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    minHeight: 48,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  pressed: {
    opacity: 0.6,
  },
  label: {
    ...typography.body.medium,
    fontFamily: fonts.regular,
    fontWeight: '400',
    flex: 1,
  },
  labelCentered: {
    textAlign: 'center',
  },
});
