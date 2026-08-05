import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import Icon from './icons/Icon';
import GlassSurface from './GlassSurface';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts } from '../../theme/typography';

const PILL_RADIUS = 20;

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
      style={({ pressed }) => [
        styles.pressable,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.shadow}>
        <GlassSurface
          bare
          interactive
          style={styles.pill}
        >
          <View style={styles.row}>
            <Icon name="streakFilled" size={30} color={colors.orange[500]} />
            <Text style={styles.count}>{streakDays}</Text>
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
    borderRadius: PILL_RADIUS,
    borderCurve: 'continuous',
  },
  pill: {
    borderRadius: PILL_RADIUS,
    borderCurve: 'continuous',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glass.edge,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    height: 40,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  count: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 20,
    lineHeight: 24,
    color: colors.neutral[900],
  },
});