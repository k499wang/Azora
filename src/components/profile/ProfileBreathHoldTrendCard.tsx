import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { card } from '../../theme/card';
import LineGraph, { type DataPoint } from '../analytics/LineGraph';

interface ProfileBreathHoldTrendCardProps {
  data: DataPoint[];
}

export default function ProfileBreathHoldTrendCard({
  data,
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

      <LineGraph
        data={data}
        unit="s"
        highlightIndex={bestIndex}
        lineColor={colors.primary.blue600}
        fillColor={colors.primary.blue100}
        dotColor={colors.primary.blue700}
      />
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
