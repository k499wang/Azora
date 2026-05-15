import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { fonts, typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface SettingsGearButtonProps {
  onPress: () => void;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  size?: number;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

const DEFAULT_SIZE = 48;

export default function SettingsGearButton({
  onPress,
  color = colors.text.primary,
  backgroundColor = colors.background.elevated,
  borderColor = colors.border.subtle,
  size = DEFAULT_SIZE,
  label,
  style,
}: SettingsGearButtonProps) {
  const isPill = label != null;
  const iconSize = isPill ? 18 : Math.round(size * 0.55);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label ?? 'Session settings'}
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        isPill
          ? {
              backgroundColor,
              borderColor,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              borderRadius: 999,
            }
          : {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor,
              borderColor,
            },
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={styles.row}>
        <MaterialCommunityIcons name="cog-outline" size={iconSize} color={color} />
        {label ? <Text style={[styles.label, { color }]}>{label}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
});
