import { Text } from '../common/Text';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { card } from '../../theme/card';
import LineGraph from '../analytics/LineGraph';
import { buildBpmSeries, type BpmTimePoint } from '../../lib/heartRate/bpmSeries';

interface HRGraphCardProps {
  samples: BpmTimePoint[];
  durationSec: number;
  maxPoints?: number;
}

export default function HRGraphCard({
  samples,
  durationSec: _durationSec,
  maxPoints = 24,
}: HRGraphCardProps) {
  const data = useMemo(
    () =>
      buildBpmSeries(samples, { maxPoints }).points.map((point) => ({
        label: point.label,
        value: point.bpm,
      })),
    [samples, maxPoints],
  );

  return (
    <View style={styles.graphCard}>
      <Text style={styles.graphTitle}>Heart rate</Text>
      <LineGraph
        data={data}
        unit=""
        height={180}
        lineColor={colors.primary.blue500}
        fillColor={colors.primary.blue100}
        dotColor={colors.primary.blue600}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  graphCard: {
    ...card.base,
    ...card.shadow,
    width: '100%',
    padding: spacing.md,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  graphTitle: {
    ...typography.heading.heading1,
    color: colors.text.secondary,
    fontFamily: fonts.semibold,
    marginBottom: spacing.xs,
  },
});
