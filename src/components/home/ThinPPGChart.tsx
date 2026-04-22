import { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface ThinPPGChartProps {
  title: string;
  data: number[];
  durationSec: number;
  color?: string;
  height?: number;
}

const PADDING = { top: 6, right: 6, bottom: 4, left: 6 };

export default function ThinPPGChart({
  title,
  data,
  durationSec,
  color = colors.primary.blue500,
  height = 110,
}: ThinPPGChartProps) {
  const [width, setWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w !== width) setWidth(w);
  };

  const chart = useMemo(() => {
    if (width <= 0 || data.length < 2) return null;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const pMax = max + range * 0.15;
    const pMin = min - range * 0.15;
    const pRange = pMax - pMin;

    const innerW = width - PADDING.left - PADDING.right;
    const innerH = height - PADDING.top - PADDING.bottom;
    const baselineY = height - PADDING.bottom;

    const points = data.map((v, i) => {
      const x = PADDING.left + (i / (data.length - 1)) * innerW;
      const y = PADDING.top + (1 - (v - pMin) / pRange) * innerH;
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

    const fill = `${line} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`;

    const gridYs = [0, 0.5, 1].map((p) => PADDING.top + p * innerH);

    return { line, fill, gridYs };
  }, [data, width, height]);

  const xTicks = useMemo(() => {
    if (durationSec <= 0) return [];
    const step = durationSec >= 45 ? 15 : durationSec >= 20 ? 10 : 5;
    const ticks: string[] = [];
    for (let s = 0; s <= durationSec; s += step) {
      ticks.push(`${s}s`);
    }
    return ticks;
  }, [durationSec]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.chartWrap} onLayout={onLayout}>
        {chart ? (
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id="ppgFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={color} stopOpacity={0.25} />
                <Stop offset="1" stopColor={color} stopOpacity={0.02} />
              </LinearGradient>
            </Defs>
            {chart.gridYs.map((y, i) => (
              <Line
                key={`ppg-grid-${i}`}
                x1={PADDING.left}
                y1={y}
                x2={width - PADDING.right}
                y2={y}
                stroke={colors.neutral[200]}
                strokeWidth={1}
                strokeDasharray="3,4"
              />
            ))}
            <Path d={chart.fill} fill="url(#ppgFill)" />
            <Path
              d={chart.line}
              stroke={color}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        ) : (
          <View style={[styles.emptyChart, { height }]}>
            <Text style={styles.emptyText}>No session data yet</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.elevated,
    borderRadius: 22,
    paddingVertical: 14,
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
    marginBottom: spacing.xs,
  },
  chartWrap: {
    width: '100%',
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  xTick: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
    fontSize: 10,
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
