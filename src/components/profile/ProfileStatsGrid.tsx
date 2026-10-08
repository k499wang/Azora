import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../common/Text';
import TaskIllustration from '../common/icons/TaskIllustration';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { card } from '../../theme/card';

const ICON_SIZE = 28;

// `adjustsFontSizeToFit` on iOS shrinks against the height it is given as well
// as the width, so one line of the drawn size is the box the value may fill.
const STAT_VALUE_LINE_HEIGHT = 33;

export interface ProfileStatTile {
  label: string;
  value: string;
  icon: ComponentProps<typeof TaskIllustration>['name'];
}

interface ProfileStatsGridProps {
  stats: ProfileStatTile[];
}

export default function ProfileStatsGrid({ stats }: ProfileStatsGridProps) {
  const rows = Array.from({ length: Math.ceil(stats.length / 2) }, (_, index) =>
    stats.slice(index * 2, index * 2 + 2),
  );

  return (
    <View style={styles.grid}>
      {rows.map((row) => (
        <View key={row[0].label} style={styles.row}>
          {row.map((stat) => (
            <View key={stat.label} style={styles.tile}>
              <TaskIllustration name={stat.icon} size={ICON_SIZE} />
              <View style={styles.copy}>
                <Text
                  style={styles.value}
                  accessibilityLabel={stat.value}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {stat.value}
                </Text>
                <Text style={styles.label} numberOfLines={1}>
                  {stat.label}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tile: {
    ...card.base,
    ...card.lipped,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  copy: {
    flex: 1,
  },
  value: {
    ...typography.display.display3,
    fontFamily: fonts.semibold,
    fontSize: 28,
    lineHeight: STAT_VALUE_LINE_HEIGHT,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
    color: colors.text.primary,
  },
  label: {
    ...typography.label.medium,
    color: colors.text.secondary,
    fontFamily: fonts.medium,
  },
});
