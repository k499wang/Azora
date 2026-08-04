import { Pressable, StyleSheet } from 'react-native';
import { Text } from './Text';
import Icon from './icons/Icon';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts } from '../../theme/typography';

interface TopBarStreakProps {
  streakDays: number;
  onPress?: () => void;
}

export default function TopBarStreak({
  streakDays,
  onPress,
}: TopBarStreakProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${streakDays} day streak`}
      onPress={onPress}
      hitSlop={12}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Icon name="streakFilled" size={34} color={colors.orange[500]} />
      <Text style={styles.count}>{streakDays}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.6,
  },
  count: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 20,
    lineHeight: 24,
    color: colors.neutral[900],
  },
});
