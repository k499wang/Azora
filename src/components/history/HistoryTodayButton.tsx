import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../common/Text';
import Icon from '../common/icons/Icon';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { padding, spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { triggerTapHaptic } from '../../native/tapHaptics';

interface Props {
  onPress: () => void;
}

/** Floating way back to today from anywhere in the strip. */
export default function HistoryTodayButton({ onPress }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Jump to today"
      onPress={() => {
        triggerTapHaptic();
        onPress();
      }}
      style={({ pressed }) => [
        card.shadowElevated,
        styles.pill,
        { bottom: insets.bottom + spacing.lg },
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.label}>Today</Text>
      <Icon name="arrow-right" size={18} color={colors.text.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    right: padding.screen.horizontal,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.mdPlus,
    paddingVertical: spacing.md,
    borderRadius: 999,
    borderCurve: 'continuous',
    backgroundColor: colors.background.card,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  label: {
    ...typography.label.large,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
});
