import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { isHapticsEnabled } from '../../services/preferences/hapticsPreference';

interface OnboardingPrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export default function OnboardingPrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
}: OnboardingPrimaryButtonProps) {
  const isDisabled = disabled || loading;

  const handlePress = () => {
    if (isDisabled) return;
    if (isHapticsEnabled()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        isDisabled && styles.buttonDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.text.inverse} />
      ) : (
        <Text style={styles.text}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: 999,
    backgroundColor: colors.primary.blue600,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  buttonPressed: {
    backgroundColor: colors.primary.blue700,
    transform: [{ scale: 0.985 }],
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  text: {
    ...typography.button.large,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.inverse,
  },
});
