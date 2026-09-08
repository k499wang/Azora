import { Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import Icon from '../../../../components/common/icons/Icon';
import { isHapticsEnabled } from '../../../../services/preferences/hapticsPreference';
import type { ExerciseDarkTheme } from '../../../../theme/exerciseDarkThemes';
import { spacing } from '../../../../theme/spacing';

interface ExerciseBackButtonProps {
  theme: ExerciseDarkTheme;
  onPress: () => void;
  accessibilityLabel: string;
}

export function ExerciseBackButton({
  theme,
  onPress,
  accessibilityLabel,
}: ExerciseBackButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={spacing.sm}
      onPress={() => {
        if (isHapticsEnabled()) Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Icon name="chevron-left" size={26} color={theme.iconPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
