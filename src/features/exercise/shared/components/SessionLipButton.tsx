import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from '../../../../components/common/Text';
import { isHapticsEnabled } from '../../../../services/preferences/hapticsPreference';
import type { ExerciseDarkTheme } from '../../../../theme/exerciseDarkThemes';
import { radius } from '../../../../theme/card';
import { pressable } from '../../../../theme/pressable';
import { spacing } from '../../../../theme/spacing';
import { fonts, typography } from '../../../../theme/typography';

interface SessionLipButtonProps {
  theme: ExerciseDarkTheme;
  icon: 'cog-outline' | 'play' | 'lock-outline';
  label: string;
  onPress: () => void;
  primary?: boolean;
}

function darkenHexColor(hex: string, amount = 0.28): string {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (match == null) return hex;

  const value = Number.parseInt(match[1], 16);
  const channel = (shift: number) =>
    Math.round(((value >> shift) & 0xff) * (1 - amount));
  return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`;
}

export function SessionLipButton({
  theme,
  icon,
  label,
  onPress,
  primary = false,
}: SessionLipButtonProps) {
  const backgroundColor = primary ? theme.accentFill : theme.surface;
  const foregroundColor = primary ? theme.screen : theme.textPrimary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        if (isHapticsEnabled()) Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          borderColor: primary ? theme.accentFill : theme.surfaceBorder,
          borderBottomColor: primary
            ? darkenHexColor(theme.accentFill)
            : theme.surfaceBorder,
        },
        pressed && pressable.control,
      ]}
    >
      <MaterialCommunityIcons name={icon} size={22} color={foregroundColor} />
      <Text style={[styles.label, { color: foregroundColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.medium,
    borderWidth: 1,
    borderBottomWidth: 4,
  },
  label: {
    ...typography.button.large,
    fontFamily: fonts.semibold,
  },
});
