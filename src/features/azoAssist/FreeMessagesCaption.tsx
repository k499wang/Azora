import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../components/common/Text';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

interface Props {
  left: number;
  onUpgrade: () => void;
}

/** One quiet line above the input, the way Claude and Perplexity show a free allowance. */
export default function FreeMessagesCaption({ left, onUpgrade }: Props) {
  const count = left === 0
    ? 'No free messages left'
    : left === 1 ? '1 free message left' : `${left} free messages left`;
  return (
    <View style={styles.row}>
      <Text style={styles.count}>{count}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Upgrade to Azora Pro for unlimited messages"
        hitSlop={spacing.sm}
        onPress={onUpgrade}
      >
        {({ pressed }) => (
          <Text style={[styles.upgrade, pressed && styles.pressed]}>Upgrade</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  count: {
    ...typography.label.medium,
    fontFamily: fonts.medium,
    color: colors.text.tertiary,
  },
  upgrade: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    color: colors.primary.blue600,
  },
  pressed: { opacity: 0.6 },
});
