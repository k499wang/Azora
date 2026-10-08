import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Path } from '@shopify/react-native-skia';
import { Text } from '../common/Text';
import { spacing } from '../../theme/spacing';
import { chart, chartText } from './chartTokens';
import { axesPath, plotBox } from './chartPaths';

interface AxesProps {
  width: number;
}

/** Drawn inside the chart's Canvas, after the series so the axes stay crisp. */
export function ChartAxes({ width }: AxesProps) {
  const path = useMemo(
    () =>
      axesPath(
        plotBox(width),
        chart.axisTipInset,
        width - chart.axisTipInset,
      ),
    [width],
  );

  return (
    <Path
      path={path}
      style="stroke"
      strokeWidth={chart.axisWidth}
      strokeCap="round"
      strokeJoin="round"
      color={chart.axisColor}
    />
  );
}

interface TitlesProps {
  y: string;
  x?: string;
  yTitlePosition?: 'beside' | 'above';
}

/** The y title at the top of the y axis and the x title under the right end of the x axis. */
export function ChartAxisTitles({ y, x, yTitlePosition = 'beside' }: TitlesProps) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Text
        style={[
          chartText.axisTitle,
          styles.yTitle,
          yTitlePosition === 'above' && styles.yTitleAbove,
        ]}
      >
        {y}
      </Text>
      {x ? <Text style={[chartText.axisTitle, styles.xTitle]}>{x}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  yTitle: {
    position: 'absolute',
    top: 0,
    left: chart.padLeft + chart.axisWidth + spacing.xs,
  },
  yTitleAbove: {
    top: undefined,
    bottom: chart.height - chart.axisTipInset + spacing.sm,
    left: chart.padLeft,
  },
  xTitle: {
    position: 'absolute',
    top: chart.height - chart.padBottom + spacing.sm,
    right: chart.axisTipInset,
  },
});
