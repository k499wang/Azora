import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import Icon from './icons/Icon';
import GlassSurface from './GlassSurface';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { pressable } from '../../theme/pressable';
import { spacing } from '../../theme/spacing';
import { fonts } from '../../theme/typography';
import { triggerTapHaptic } from '../../native/tapHaptics';

interface TopBarStreakProps {
  streakDays: number;
  onPress?: () => void;
  size?: 'regular' | 'compact';
}

export default function TopBarStreak({
  streakDays,
  onPress,
  size = 'regular',
}: TopBarStreakProps) {
  const compact = size === 'compact';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${streakDays} day streak`}
      onPress={() => {
        if (onPress == null) return;
        triggerTapHaptic();
        onPress();
      }}
      hitSlop={12}
      style={({ pressed }) => [
        styles.pressable,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.shadow}>
        <GlassSurface
          bare
          interactive
          style={[styles.pill, compact && styles.pillCompact]}
        >
          <View style={[styles.row, compact && styles.rowCompact]}>
            <Icon name="streakFilled" size={compact ? 22 : 30} color={colors.orange[500]} />
            <Text style={[styles.count, compact && styles.countCompact]}>{streakDays}</Text>
          </View>
        </GlassSurface>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  shadow: {
    ...card.shadowElevated,
    borderRadius: radius.large,
    borderCurve: 'continuous',
  },
  pill: {
    borderRadius: radius.large,
    borderCurve: 'continuous',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glass.edge,
  },
  pillCompact: {
    borderRadius: radius.medium,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    height: 40,
  },
  rowCompact: {
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    height: 30,
  },
  pressed: pressable.control,
  count: {
    fontFamily: fonts.semibold,
    fontSize: 20,
    lineHeight: 24,
    color: colors.neutral[900],
  },
  countCompact: {
    fontSize: 16,
    lineHeight: 20,
  },
});
