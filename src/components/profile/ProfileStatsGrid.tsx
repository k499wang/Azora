import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Polyline } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { card } from '../../theme/card';
import Icon, { type IconName } from '../common/icons/Icon';

export interface ProfileStatBadge {
  label: string;
  value: string;
  detail: string;
  icon: IconName;
}

export interface ProfileStatHero extends ProfileStatBadge {
  trend: number[];
}

interface ProfileStatsGridProps {
  hero: ProfileStatHero;
  secondary: ProfileStatBadge[];
}

const SPARK_WIDTH = 132;
const SPARK_HEIGHT = 56;

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const stepX = SPARK_WIDTH / (values.length - 1);
  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = SPARK_HEIGHT - ((v - min) / span) * (SPARK_HEIGHT - 6) - 3;
    return `${x},${y}`;
  });

  const fillPath = `M0,${SPARK_HEIGHT} L${points.join(' L')} L${SPARK_WIDTH},${SPARK_HEIGHT} Z`;

  return (
    <Svg width={SPARK_WIDTH} height={SPARK_HEIGHT}>
      <Path d={fillPath} fill={colors.primary.blue100} />
      <Polyline
        points={points.join(' ')}
        fill="none"
        stroke={colors.primary.blue600}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function ProfileStatsGrid({ hero, secondary }: ProfileStatsGridProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.heroCard}>
        <View style={styles.heroLeft}>
          <View style={styles.heroLabelRow}>
            <Icon name={hero.icon} size={16} color={colors.primary.blue600} />
            <Text style={styles.heroLabel}>{hero.label}</Text>
          </View>
          <Text style={styles.heroValue}>{hero.value}</Text>
          <Text style={styles.heroDetail}>{hero.detail}</Text>
        </View>

        <View style={styles.heroRight}>
          <Sparkline values={hero.trend} />
        </View>
      </View>

      <View style={styles.secondaryRow}>
        {secondary.map((badge) => (
          <View key={badge.label} style={styles.secondaryCard}>
            <Icon name={badge.icon} size={18} color={colors.primary.blue600} />
            <Text style={styles.secondaryValue}>{badge.value}</Text>
            <Text style={styles.secondaryLabel}>{badge.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  heroCard: {
    ...card.base,
    ...card.shadow,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  heroLeft: {
    flex: 1,
    gap: spacing.xs,
  },
  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  heroLabel: {
    ...typography.label.medium,
    color: colors.text.secondary,
    fontFamily: fonts.medium,
  },
  heroValue: {
    ...typography.display.display2,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontWeight: '500',
  },
  heroDetail: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
    fontFamily: fonts.regular,
  },
  heroRight: {
    width: SPARK_WIDTH,
    height: SPARK_HEIGHT,
    justifyContent: 'center',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryCard: {
    ...card.base,
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  secondaryValue: {
    ...typography.title.title2,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontWeight: '500',
  },
  secondaryLabel: {
    ...typography.caption.caption1,
    color: colors.text.secondary,
    fontFamily: fonts.regular,
  },
});
