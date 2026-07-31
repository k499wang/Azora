import { StyleSheet, View } from 'react-native';
import { Text } from '../common/Text';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { card } from '../../theme/card';
import Icon, { type IconName } from '../common/icons/Icon';
import {
  formatProfileCount,
  formatProfileDuration,
} from '../../services/profile/profileSummaryService';

interface ProfileLifetimeStatsRowProps {
  totalBreaths: number;
  totalSessions: number;
  totalHoldSeconds: number;
}

interface LifetimeStat {
  label: string;
  value: string;
  icon: IconName;
}

export default function ProfileLifetimeStatsRow({
  totalBreaths,
  totalSessions,
  totalHoldSeconds,
}: ProfileLifetimeStatsRowProps) {
  const stats: LifetimeStat[] = [
    { label: 'Breaths', value: formatProfileCount(totalBreaths), icon: 'lungs' },
    { label: 'Sessions', value: formatProfileCount(totalSessions), icon: 'meditation' },
    { label: 'Time held', value: formatProfileDuration(totalHoldSeconds), icon: 'breath-hold' },
  ];

  return (
    <View style={styles.row}>
      {stats.map((stat) => (
        <View key={stat.label} style={styles.statCard}>
          <Icon name={stat.icon} size={18} color={colors.primary.blue600} />
          <Text style={styles.statValue}>{stat.value}</Text>
          <Text style={styles.statLabel}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    ...card.base,
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  statValue: {
    ...typography.title.title2,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontWeight: '500',
  },
  statLabel: {
    ...typography.caption.caption1,
    color: colors.text.secondary,
    fontFamily: fonts.regular,
  },
});
