import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../common/Text';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

interface Props {
  title: string;
  detail: string;
  selected: boolean;
  showRadio?: boolean;
  disabled?: boolean;
  busy?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'radio';
  onPress: () => void;
}

/** The compact choice shared by subscription plans and trial reminders. */
export function PaywallChoiceCard({
  title,
  detail,
  selected,
  showRadio = true,
  disabled = false,
  busy = false,
  accessibilityLabel,
  accessibilityRole = 'button',
  onPress,
}: Props) {
  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected, disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.selected,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.detail}>{detail}</Text>
      </View>
      {showRadio ? (
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected ? <View style={styles.dot} /> : null}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card.base,
    ...card.shadow,
    backgroundColor: colors.background.card,
    borderColor: colors.neutral[200],
    borderWidth: 2,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  selected: { borderColor: colors.primary.blue500 },
  pressed: { transform: [{ scale: 0.97 }] },
  disabled: { opacity: 0.5 },
  copy: { flex: 1 },
  title: {
    ...typography.heading.heading1,
    fontSize: 20,
    lineHeight: 28,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  detail: { ...typography.caption.caption1, color: colors.text.secondary, marginTop: 2 },
  radio: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: colors.neutral[300],
    alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary.blue500 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary.blue500 },
});
