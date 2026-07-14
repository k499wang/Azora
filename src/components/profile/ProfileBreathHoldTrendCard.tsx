import { Text } from '../common/Text';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { card } from '../../theme/card';
import LineGraph, { type DataPoint } from '../analytics/LineGraph';
import LockedContentBlur from '../common/LockedContentBlur';
import BreathHoldStatsRow from '../exercise/BreathHoldStatsRow';

interface ProfileBreathHoldTrendCardProps {
  data: DataPoint[];
  bestHoldSeconds: number | null;
  todayHoldSeconds: number | null;
  avgHoldSeconds: number | null;
  locked?: boolean;
  onPressLocked?: () => void;
}

export default function ProfileBreathHoldTrendCard({
  data,
  bestHoldSeconds,
  todayHoldSeconds,
  avgHoldSeconds,
  locked = false,
  onPressLocked,
}: ProfileBreathHoldTrendCardProps) {
  const bestIndex = useMemo(() => {
    if (data.length === 0) return undefined;

    let maxIndex = 0;
    let maxValue = data[0].value;

    data.forEach((point, index) => {
      if (point.value > maxValue) {
        maxValue = point.value;
        maxIndex = index;
      }
    });

    return maxIndex;
  }, [data]);

  return (
    <View style={styles.card}>
      <LockedContentBlur locked={locked} onPressLocked={onPressLocked}>
        <View
          style={styles.graph}
          accessibilityElementsHidden={locked}
          importantForAccessibility={locked ? 'no-hide-descendants' : 'auto'}
        >
          <LineGraph
            data={data}
            unit="s"
            height={210}
            highlightIndex={bestIndex}
            lineColor={colors.primary.blue600}
            fillColor={colors.primary.blue100}
            dotColor={colors.primary.blue700}
            showXAxisLabels={false}
            valuePaddingRatio={0.04}
          />
        </View>
      </LockedContentBlur>

      <View style={styles.divider} />

      <BreathHoldStatsRow
        bestHoldSeconds={bestHoldSeconds}
        todayHoldSeconds={todayHoldSeconds}
        avgHoldSeconds={avgHoldSeconds}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card.base,
    ...card.shadow,
    padding: spacing.lg,
  },
  graph: {
    marginHorizontal: -spacing.xs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
    marginHorizontal: -spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
});
