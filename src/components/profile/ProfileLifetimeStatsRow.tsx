import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../common/Text';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { card } from '../../theme/card';
import Icon, { type IconName } from '../common/icons/Icon';
import { formatProfileCount, formatProfileDuration } from '../../lib/profileStatsFormat';

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
    { label: 'Breaths', value: formatProfileCount(totalBreaths), icon: 'waves' },
    { label: 'Sessions', value: formatProfileCount(totalSessions), icon: 'lotus' },
    { label: 'Time held', value: formatProfileDuration(totalHoldSeconds), icon: 'timer' },
  ];

  return (
    <View style={styles.card}>
      {stats.map((stat, index) => (
        <Fragment key={stat.label}>
          {index > 0 ? <View style={styles.divider} /> : null}
          <View style={styles.stat}>
            <Icon name={stat.icon} size={28} color={colors.primary.blue600} />
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text
              style={styles.statValue}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {stat.value}
            </Text>
          </View>
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card.base,
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: spacing.md,
  },
  stat: {
    flex: 1,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: spacing.xs,
    backgroundColor: colors.border.subtle,
  },
  statLabel: {
    ...typography.label.medium,
    color: colors.text.secondary,
    fontFamily: fonts.regular,
    textAlign: 'center',
  },
  statValue: {
    ...typography.display.display3,
    lineHeight: 38,
    marginTop: spacing.sm,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    textAlign: 'center',
  },
});
