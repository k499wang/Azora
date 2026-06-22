import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from '../common/icons/Icon';
import GlassCard from '../common/GlassCard';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

interface TodayRibbonProps {
  streakDays: number;
  todayDone: boolean;
  onPress?: () => void;
}

function buildCopy(streakDays: number, todayDone: boolean): { title: string; subtitle: string } {
  if (todayDone) {
    return {
      title: streakDays > 1 ? `${streakDays}-day streak` : 'Day 1 done',
      subtitle: 'Logged for today — nice work',
    };
  }
  if (streakDays <= 0) {
    return { title: 'Start your streak', subtitle: 'One breath hold gets you going' };
  }
  return {
    title: streakDays === 1 ? 'Day 1 in the books' : `${streakDays}-day streak`,
    subtitle: 'Keep it alive — log today',
  };
}

export default function TodayRibbon({ streakDays, todayDone, onPress }: TodayRibbonProps) {
  const { title, subtitle } = buildCopy(streakDays, todayDone);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <GlassCard interactive contentStyle={styles.content}>
        <View style={[styles.iconBadge, todayDone && styles.iconBadgeDone]}>
          <Icon
            name={todayDone ? 'check' : 'streak'}
            size={22}
            color={todayDone ? colors.success[700] : colors.orange[600]}
          />
        </View>

        <View style={styles.textColumn}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>

        <Icon name="chevron-right" size={20} color={colors.text.tertiary} />
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.orange[100],
  },
  iconBadgeDone: {
    backgroundColor: colors.success[100],
  },
  textColumn: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
  },
});
