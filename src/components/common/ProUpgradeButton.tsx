import { Text } from './Text';
import { Pressable, StyleSheet } from 'react-native';
import Icon from './icons/Icon';
import { colors } from '../../theme/colors';
import { card, radius } from '../../theme/card';
import { pressable } from '../../theme/pressable';
import { spacing } from '../../theme/spacing';
import { typography, fonts } from '../../theme/typography';
import { triggerTapHaptic } from '../../native/tapHaptics';

interface ProUpgradeButtonProps {
  onPress?: () => void;
  label?: string;
}

export default function ProUpgradeButton({
  onPress,
  label = 'Get Pro',
}: ProUpgradeButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={onPress == null}
      onPress={() => {
        if (onPress == null) return;
        triggerTapHaptic();
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
      ]}
    >
      <Icon name="lock" size={15} color={colors.text.inverse} />
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.neutral[900],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    ...card.shadow,
  },
  buttonPressed: pressable.control,
  text: {
    ...typography.label.small,
    color: colors.text.inverse,
    fontFamily: fonts.semibold,
    fontWeight: '500',
  },
});
