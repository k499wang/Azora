import { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export interface DataPoint {
  label: string;
  value: number;
}

interface BarGraphProps {
  data: DataPoint[];
  title?: string;
  subtitle?: string;
  unit?: string;
  height?: number;
  barColor?: string;
  highlightIndex?: number;
  highlightColor?: string;
}

const CHART_PADDING = {
  top: 24,
  right: 0,
  bottom: 28,
  left: 0,
};

const BAR_RADIUS = 6;

export default function BarGraph({
  data,
  title,
  subtitle,
  unit = '',
  height = 180,
  barColor = colors.primary.blue500,
  highlightIndex,
  highlightColor = colors.orange[400],
}: BarGraphProps) {
  const [containerWidth, setContainerWidth] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);
    if (nextWidth !== containerWidth) {
      setContainerWidth(nextWidth);
    }
  };

  const chart = useMemo(() => {
    if (data.length === 0 || containerWidth <= 0) {
      return null;
    }

    const maxValue = Math.max(...data.map((d) => d.value));
    const ceiledMax = Math.ceil(maxValue / 10) * 10;

    const innerWidth = containerWidth - CHART_PADDING.left - CHART_PADDING.right;
    const innerHeight = height - CHART_PADDING.top - CHART_PADDING.bottom;
    const slotWidth = innerWidth / data.length;
    const barWidth = slotWidth * 0.85;

    const bars = data.map((point, index) => {
      const centerX = CHART_PADDING.left + slotWidth * index + slotWidth / 2;
      const barHeight = ceiledMax > 0 ? (point.value / ceiledMax) * innerHeight : 0;
      return {
        ...point,
        centerX,
        barHeight,
        barLeft: centerX - barWidth / 2,
        barWidth,
      };
    });

    return { bars };
  }, [data, height, containerWidth]);

  if (data.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <View style={styles.container} onLayout={onLayout}>
        {chart ? (
          <View style={[styles.chartArea, { height }]}>
            {chart.bars.map((bar, index) => {
              const isHighlighted = index === highlightIndex;
              return (
                <View
                  key={`bar-${bar.label}-${index}`}
                  style={[
                    styles.bar,
                    {
                      left: bar.barLeft,
                      width: bar.barWidth,
                      height: bar.barHeight,
                      bottom: CHART_PADDING.bottom,
                      backgroundColor: isHighlighted ? highlightColor : barColor,
                    },
                  ]}
                />
              );
            })}

            {chart.bars.map((bar, index) => {
              const barTop = height - CHART_PADDING.bottom - bar.barHeight;
              const isHighlighted = index === highlightIndex;
              return (
                <Text
                  key={`val-${bar.label}-${index}`}
                  style={[
                    styles.valueLabel,
                    { left: bar.centerX - 20, top: barTop - 18 },
                    isHighlighted && { color: highlightColor, fontWeight: '700' },
                  ]}
                  numberOfLines={1}
                >
                  {bar.value}{unit}
                </Text>
              );
            })}

            {chart.bars.map((bar, index) => (
              <Text
                key={`label-${bar.label}-${index}`}
                style={[styles.xLabel, { left: bar.centerX - 18, bottom: 0 }]}
                numberOfLines={1}
              >
                {bar.label}
              </Text>
            ))}
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
  title: {
    ...typography.heading.heading1,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body.small,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  container: {
    overflow: 'hidden',
  },
  chartArea: {
    position: 'relative',
    width: '100%',
  },
  bar: {
    position: 'absolute',
    borderTopLeftRadius: BAR_RADIUS,
    borderTopRightRadius: BAR_RADIUS,
  },
  valueLabel: {
    ...typography.caption.caption1,
    position: 'absolute',
    width: 40,
    textAlign: 'center',
    color: colors.text.primary,
    fontWeight: '600',
  },
  xLabel: {
    ...typography.caption.caption1,
    position: 'absolute',
    width: 36,
    textAlign: 'center',
    color: colors.text.secondary,
  },
  placeholder: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    ...typography.body.small,
    color: colors.text.tertiary,
  },
});
