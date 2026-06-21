import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { card } from '../../theme/card';
import LineGraph, { type DataPoint } from '../analytics/LineGraph';
import LockedContentBlur from '../common/LockedContentBlur';

interface ProfileBreathHoldTrendCardProps {
  data: DataPoint[];
  locked?: boolean;
  onPressLocked?: () => void;
}

export default function ProfileBreathHoldTrendCard({
  data,
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
      <Text style={styles.title}>Average hold over time</Text>

      <LockedContentBlur locked={locked} onPressLocked={onPressLocked}>
        <View
          accessibilityElementsHidden={locked}
          importantForAccessibility={locked ? 'no-hide-descendants' : 'auto'}
        >
          <LineGraph
            data={data}
            unit="s"
            highlightIndex={bestIndex}
            lineColor={colors.primary.blue600}
            fillColor={colors.primary.blue100}
            dotColor={colors.primary.blue700}
          />
        </View>
      </LockedContentBlur>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card.base,
    ...card.shadow,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    ...typography.heading.heading2,
    color: colors.text.primary,
    fontSize: 18,
  },
});
