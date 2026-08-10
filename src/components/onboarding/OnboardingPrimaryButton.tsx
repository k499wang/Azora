import ChunkyButton from '../common/ChunkyButton';

interface OnboardingPrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  enableHaptics?: boolean;
}

/**
 * Onboarding's continue button. Kept as its own name because forty screens
 * import it, but the shape and the lip now come from `ChunkyButton` so it
 * cannot drift from the rest of the app's primaries.
 */
export default function OnboardingPrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  enableHaptics = true,
}: OnboardingPrimaryButtonProps) {
  return (
    <ChunkyButton
      label={label}
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      haptic={enableHaptics ? 'medium' : 'none'}
    />
  );
}
