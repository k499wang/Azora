import { Pressable, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography, fonts } from '../../theme/typography';
import { card } from '../../theme/card';

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
      disabled={onPress == null}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
      ]}
    >
      <MaterialCommunityIcons
        name="lock"
        size={15}
        color={colors.text.inverse}
      />
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
    borderRadius: 999,
    ...card.shadow,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  text: {
    ...typography.label.small,
    color: colors.text.inverse,
    fontFamily: fonts.semibold,
    fontWeight: '600',
  },
});
