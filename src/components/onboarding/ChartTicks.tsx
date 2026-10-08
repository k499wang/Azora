import { StyleSheet, View } from 'react-native';
import { Text } from '../common/Text';
import { spacing } from '../../theme/spacing';
import { chart, chartText } from './chartTokens';

interface Props {
  start: string;
  end: string;
}

export default function ChartTicks({ start, end }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.tick}>{start}</Text>
      <Text style={[styles.tick, styles.end]}>{end}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Pulled up across the column gap and the canvas's bottom padding so the
  // labels hang just under the x axis.
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: -(chart.gap + chart.padBottom - spacing.sm),
    paddingLeft: chart.padLeft,
    paddingRight: chart.padRight,
  },
  tick: chartText.tick,
  end: {
    textAlign: 'right',
  },
});
