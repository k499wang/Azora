import { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export interface DataPoint {
  label: string;
  value: number;
}

interface LineGraphProps {
  data: DataPoint[];
  subtitle?: string;
  unit?: string;
  height?: number;
  lineColor?: string;
  fillColor?: string;
  dotColor?: string;
  highlightIndex?: number;
  highlightColor?: string;
}

const CHART_PADDING = {
  top: 28,
  right: 16,
  bottom: 28,
  left: 16,
};

export default function LineGraph({
  data,
  subtitle,
  unit = '',
  height = 180,
  lineColor = colors.primary.blue500,
  fillColor = colors.primary.blue100,
  dotColor = colors.primary.blue600,
  highlightIndex,
  highlightColor = colors.orange[400],
}: LineGraphProps) {
  const [containerWidth, setContainerWidth] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);
    if (nextWidth !== containerWidth) {
      setContainerWidth(nextWidth);
    }
  };

  const chart = useMemo(() => {
    if (data.length === 0 || containerWidth <= 0) return null;

    const values = data.map((d) => d.value);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const maxIndex = values.indexOf(maxValue);
    const minIndex = values.indexOf(minValue);
    const lastIndex = data.length - 1;
    const range = maxValue - minValue || 1;
    const paddedMax = maxValue + range * 0.15;
    const paddedMin = minValue - range * 0.15;
    const paddedRange = paddedMax - paddedMin;

    const innerWidth = containerWidth - CHART_PADDING.left - CHART_PADDING.right;
    const innerHeight = height - CHART_PADDING.top - CHART_PADDING.bottom;

    const points = data.map((point, index) => {
      const x =
        data.length === 1
          ? CHART_PADDING.left + innerWidth / 2
          : CHART_PADDING.left + (index / (data.length - 1)) * innerWidth;
      const y = CHART_PADDING.top + (1 - (point.value - paddedMin) / paddedRange) * innerHeight;
      return { ...point, x, y };
    });

    // Smooth cubic bezier path
    let linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const tension = 0.3;
      const dx = next.x - curr.x;
      const cp1x = curr.x + dx * tension;
      const cp2x = next.x - dx * tension;
      linePath += ` C ${cp1x} ${curr.y}, ${cp2x} ${next.y}, ${next.x} ${next.y}`;
    }

    // Fill path (line path closed to bottom)
    const fillBottom = CHART_PADDING.top + innerHeight;
    const fillPath =
      linePath +
      ` L ${points[points.length - 1].x} ${fillBottom}` +
      ` L ${points[0].x} ${fillBottom} Z`;

    const valueLabelIndices = new Set<number>();
    if (data.length <= 3) {
      data.forEach((_, i) => valueLabelIndices.add(i));
    } else {
      valueLabelIndices.add(minIndex);
      valueLabelIndices.add(maxIndex);
      valueLabelIndices.add(lastIndex);
      if (
        highlightIndex != null &&
        highlightIndex >= 0 &&
        highlightIndex < data.length
      ) {
        valueLabelIndices.add(highlightIndex);
      }
    }

    const xLabelIndices = new Set<number>();
    if (data.length <= 3) {
      data.forEach((_, i) => xLabelIndices.add(i));
    } else {
      xLabelIndices.add(0);
      xLabelIndices.add(Math.floor(lastIndex / 2));
      xLabelIndices.add(lastIndex);
    }

    return {
      points,
      linePath,
      fillPath,
      fillBottom,
      valueLabelIndices,
      xLabelIndices,
      minIndex,
      maxIndex,
    };
  }, [data, height, containerWidth, highlightIndex]);

  return (
    <View style={styles.wrapper}>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <View style={styles.container} onLayout={onLayout}>
        {data.length === 0 ? (
          <View style={[styles.emptyChart, { height }]}>
            <Text style={styles.emptyTitle}>No holds yet</Text>
            <Text style={styles.emptyBody}>
              Complete your first breath hold to start tracking your progress.
            </Text>
          </View>
        ) : chart ? (
          <View style={[styles.chartArea, { height }]}>
            <Svg width={containerWidth} height={height}>
              <Defs>
                <LinearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={fillColor} stopOpacity={0.6} />
                  <Stop offset="1" stopColor={fillColor} stopOpacity={0.05} />
                </LinearGradient>
              </Defs>

              {/* Gradient fill */}
              <Path d={chart.fillPath} fill="url(#fillGrad)" />

              {/* Line */}
              <Path
                d={chart.linePath}
                stroke={lineColor}
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Dots — only on anchor points to keep the line clean */}
              {chart.points.map((point, index) => {
                if (!chart.valueLabelIndices.has(index)) return null;
                const isHighlighted = index === highlightIndex;
                return (
                  <Circle
                    key={`dot-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r={isHighlighted ? 5 : 3.5}
                    fill={isHighlighted ? highlightColor : dotColor}
                    stroke={colors.background.elevated}
                    strokeWidth={2}
                  />
                );
              })}
            </Svg>

            {/* Value labels — min, max, last (and highlight if set) */}
            {chart.points.map((point, index) => {
              if (!chart.valueLabelIndices.has(index)) return null;
              const isHighlighted = index === highlightIndex;
              return (
                <Text
                  key={`val-${index}`}
                  style={[
                    styles.valueLabel,
                    {
                      left: point.x - 20,
                      top: point.y - 22,
                    },
                    isHighlighted && {
                      color: highlightColor,
                      fontWeight: '600',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {point.value}
                  {unit}
                </Text>
              );
            })}

            {/* X-axis labels — first, middle, last only */}
            {chart.points.map((point, index) => {
              if (!chart.xLabelIndices.has(index)) return null;
              const isFirst = index === 0;
              const isLast = index === chart.points.length - 1;
              const positionStyle = isFirst
                ? { left: 0, textAlign: 'left' as const }
                : isLast
                  ? { right: 0, textAlign: 'right' as const }
                  : { left: point.x - 24, textAlign: 'center' as const };
              return (
                <Text
                  key={`label-${index}`}
                  style={[styles.xLabel, positionStyle, { bottom: 0 }]}
                  numberOfLines={1}
                >
                  {point.label}
                </Text>
              );
            })}
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Loading chart...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  subtitle: {
    ...typography.body.small,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  container: {
    overflow: 'hidden',
  },
  chartArea: {
    position: 'relative',
    width: '100%',
  },
  valueLabel: {
    ...typography.caption.caption1,
    position: 'absolute',
    width: 40,
    textAlign: 'center',
    color: colors.text.primary,
    fontWeight: '500',
  },
  xLabel: {
    ...typography.caption.caption1,
    position: 'absolute',
    width: 48,
    color: colors.text.secondary,
  },
  placeholder: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChart: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  emptyTitle: {
    ...typography.label.large,
    color: colors.text.primary,
  },
  emptyBody: {
    ...typography.body.small,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  placeholderText: {
    ...typography.body.small,
    color: colors.text.tertiary,
  },
});
