import { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface HRVChartProps {
  /**
   * Inter-beat intervals (RR / IBI) in milliseconds, captured during today's
   * breath hold via the PPG signal pipeline. Plotted as a labeled time series
   * with y-axis ticks (RR ms) and x-axis ticks (seconds).
   */
  ibiMs: number[];
  height?: number;
  color?: string;
}

const PADDING = { top: 14, right: 8, bottom: 8, left: 8 };

export default function HRVChart({
  ibiMs,
  height = 170,
  color = colors.primary.blue500,
}: HRVChartProps) {
  const [width, setWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w !== width) setWidth(w);
  };

  const durationSec = useMemo(
    () => Math.round(ibiMs.reduce((sum, ms) => sum + ms, 0) / 1000),
    [ibiMs],
  );

  const yBounds = useMemo(() => {
    if (ibiMs.length < 2) return null;
    const max = Math.max(...ibiMs);
    const min = Math.min(...ibiMs);
    const range = max - min || 1;
    return {
      pMax: max + range * 0.15,
      pMin: min - range * 0.15,
    };
  }, [ibiMs]);

  const chart = useMemo(() => {
    if (width <= 0 || ibiMs.length < 2 || !yBounds) return null;
    const pRange = yBounds.pMax - yBounds.pMin;

    const innerW = width - PADDING.left - PADDING.right;
    const innerH = height - PADDING.top - PADDING.bottom;

    const points = ibiMs.map((v, i) => {
      const x = PADDING.left + (i / (ibiMs.length - 1)) * innerW;
      const y = PADDING.top + (1 - (v - yBounds.pMin) / pRange) * innerH;
      return { x, y };
    });

    let line = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const c = points[i];
      const n = points[i + 1];
      const t = 0.3;
      const dx = n.x - c.x;
      line += ` C ${c.x + dx * t} ${c.y}, ${n.x - dx * t} ${n.y}, ${n.x} ${n.y}`;
    }

    return { line };
  }, [ibiMs, width, height, yBounds]);

  const xTicks = useMemo(() => {
    if (durationSec <= 0) return [];
    const step = durationSec >= 45 ? 15 : durationSec >= 20 ? 10 : 5;
    const ticks: string[] = [];
    for (let s = 0; s <= durationSec; s += step) {
      ticks.push(`${s}`);
    }
    return ticks;
  }, [durationSec]);

  const yTicks = useMemo(() => {
    if (!yBounds) return [];
    const { pMin, pMax } = yBounds;
    const count = 5;
    const ticks: number[] = [];
    for (let i = 0; i < count; i++) {
      const v = pMax - ((pMax - pMin) * i) / (count - 1);
      ticks.push(Math.round(v));
    }
    return ticks;
  }, [yBounds]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Heart rate variability</Text>

      <View style={styles.plotRow}>
        <View style={styles.yAxis}>
          {yTicks.map((t) => (
            <Text key={t} style={styles.yTick}>{t}</Text>
          ))}
        </View>

        <View style={styles.chartCol}>
          <View style={styles.chartWrap} onLayout={onLayout}>
            {chart ? (
              <Svg width={width} height={height}>
                {yTicks.map((_, i) => {
                  const innerH = height - PADDING.top - PADDING.bottom;
                  const y = PADDING.top + (i / (yTicks.length - 1)) * innerH;
                  return (
                    <Line
                      key={`grid-${i}`}
                      x1={PADDING.left}
                      y1={y}
                      x2={width - PADDING.right}
                      y2={y}
                      stroke={colors.neutral[200]}
                      strokeWidth={1}
                      strokeDasharray="3,4"
                    />
                  );
                })}
                <Path
                  d={chart.line}
                  stroke={color}
                  strokeWidth={2.5}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            ) : (
              <View style={[styles.emptyChart, { height }]}>
                <Text style={styles.emptyText}>Complete today's hold to see your HRV</Text>
              </View>
            )}
          </View>

          {xTicks.length > 0 ? (
            <View style={styles.xAxis}>
              {xTicks.map((t) => (
                <Text key={t} style={styles.xTick}>{t}</Text>
              ))}
            </View>
          ) : null}

          <Text style={styles.xLabel}>Time (s)</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.elevated,
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    shadowColor: colors.primary.blue700,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  title: {
    ...typography.heading.heading2,
    color: colors.text.primary,
    fontSize: 18,
    marginBottom: spacing.sm,
  },
  plotRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  yAxis: {
    justifyContent: 'space-between',
    paddingTop: PADDING.top - 7,
    paddingBottom: PADDING.bottom - 7,
    marginRight: 6,
  },
  yTick: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
    fontSize: 11,
    textAlign: 'right',
    minWidth: 28,
  },
  chartCol: {
    flex: 1,
  },
  chartWrap: {
    width: '100%',
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: PADDING.left,
  },
  xTick: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
    fontSize: 11,
  },
  xLabel: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: 4,
  },
  emptyChart: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.body.small,
    color: colors.text.tertiary,
  },
});
