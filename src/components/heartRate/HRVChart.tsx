import { useMemo, useRef, useState } from 'react';
import { Alert, Animated, Easing, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { LockedScrim } from '../common/glass';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import CardSurface from '../common/CardSurface';
import Icon from '../common/icons/Icon';
import {
  buildHrvInsight,
  type HrvInsightSummary,
} from '../../lib/heartRate/hrvInsight';

interface HRVChartProps {
  /**
   * Inter-beat intervals (RR / IBI) in milliseconds from the selected heart-rate
   * measurement. Plotted as a labeled time series
   * with y-axis ticks (RR ms) and x-axis ticks (seconds).
   */
  ibiMs: number[];
  height?: number;
  color?: string;
  locked?: boolean;
  onPressLocked?: () => void;
  insightSummary: HrvInsightSummary;
}

const PADDING = { top: 14, right: 8, bottom: 8, left: 8 };
const Y_TICK_HEIGHT = 14;

const HRV_INFO = {
  title: 'Heart Rate Variability',
  message:
    'HRV is the variation in time between consecutive heartbeats. The chart shows your RR intervals (in milliseconds) over the session — wider swings mean more variability and stronger vagal tone.\n\nHealthy resting RR intervals fall roughly between 700–1100 ms, with visible beat-to-beat variation. Higher variability generally indicates better recovery and cardiovascular health.',
};

export default function HRVChart({
  ibiMs,
  height = 170,
  color = colors.primary.blue500,
  locked = false,
  onPressLocked,
  insightSummary,
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

    const last = points[points.length - 1];
    return { line, last };
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

  const hrvInsight = useMemo(
    () => buildHrvInsight(insightSummary),
    [insightSummary],
  );
  const [insightExpanded, setInsightExpanded] = useState(true);
  const animMaxHeight = useRef(new Animated.Value(300)).current;

  const toggleInsight = () => {
    const toValue = insightExpanded ? 0 : 300;
    Animated.timing(animMaxHeight, {
      toValue,
      duration: 450,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
    setInsightExpanded((v) => !v);
  };

  return (
    <CardSurface locked={locked} style={styles.card}>
      {!locked ? (
        <Pressable
          hitSlop={10}
          onPress={() => Alert.alert(HRV_INFO.title, HRV_INFO.message)}
          style={styles.infoButton}
        >
          <MaterialCommunityIcons
            name="information-outline"
            size={16}
            color={colors.text.tertiary}
          />
        </Pressable>
      ) : null}
      <View style={[styles.titleRow, locked && styles.lockedTitleText]}>
        <Icon name="stat-hrv-curve" size={28} color={colors.primary.blue500} />
        <Text style={styles.title}>Heart rate variability</Text>
      </View>

      {!chart ? (
        <View style={[styles.emptyChart, { height }]} onLayout={onLayout}>
          <Text style={styles.emptyText}>
            Complete a full 90s heart rate measuring to see your HRV.
          </Text>
        </View>
      ) : (
      <View style={styles.plotRow}>
        <View style={[styles.yAxis, { height }]}>
          {yTicks.map((t, i) => {
            const innerH = height - PADDING.top - PADDING.bottom;
            const y = PADDING.top + (i / (yTicks.length - 1)) * innerH;
            return (
              <Text
                key={`${t}-${i}`}
                style={[styles.yTick, { top: y - Y_TICK_HEIGHT / 2 }]}
              >
                {t}
              </Text>
            );
          })}
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
                  strokeWidth={8}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.04}
                />
                <Path
                  d={chart.line}
                  stroke={color}
                  strokeWidth={5}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.09}
                />
                <Path
                  d={chart.line}
                  stroke={color}
                  strokeWidth={2.5}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Circle
                  cx={chart.last.x}
                  cy={chart.last.y}
                  r={6}
                  fill={colors.primary.blue500}
                  opacity={0.18}
                />
                <Circle
                  cx={chart.last.x}
                  cy={chart.last.y}
                  r={3}
                  fill={colors.primary.blue500}
                />
              </Svg>
            ) : null}
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
      )}
      {chart && !locked && hrvInsight ? (
        <View style={styles.insightsSection}>
          <View style={styles.insightsDivider} />
          <Pressable style={styles.insightsHeader} onPress={toggleInsight}>
            <Icon name="sparkle" size={16} color={colors.primary.blue500} />
            <Text style={styles.insightsTitle}>Insights</Text>
            <Text style={styles.insightsToggle}>{insightExpanded ? '−' : '+'}</Text>
          </Pressable>
          <Animated.View style={{ maxHeight: animMaxHeight, overflow: 'hidden' }}>
            <Text style={styles.insightText}>{hrvInsight}</Text>
          </Animated.View>
        </View>
      ) : null}
      {locked ? (
        <>
          <LockedScrim />
          <View style={[styles.titleRow, styles.clearTitle]}>
            <Icon name="stat-hrv-curve" size={28} color={colors.primary.blue500} />
            <Text style={styles.title}>Heart rate variability</Text>
          </View>
          {onPressLocked ? (
            <Pressable
              accessibilityRole="button"
              onPress={onPressLocked}
              style={StyleSheet.absoluteFill}
            />
          ) : null}
        </>
      ) : null}
    </CardSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginLeft: -spacing.xs,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.heading.heading2,
    color: colors.text.secondary,
    fontFamily: fonts.semibold,
    fontSize: 16,
  },
  lockedTitleText: {
    opacity: 0,
  },
  clearTitle: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    zIndex: 2,
    marginLeft: -spacing.xs,
  },
  plotRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  yAxis: {
    position: 'relative',
    width: 28,
    marginRight: 6,
  },
  yTick: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
    fontSize: 11,
    lineHeight: Y_TICK_HEIGHT,
    textAlign: 'right',
    position: 'absolute',
    right: 0,
    width: 28,
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
    marginTop: spacing.xs,
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
    marginTop: spacing.xs,
  },
  emptyChart: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    ...typography.body.small,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  infoButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  insightsSection: {
    marginTop: spacing.md,
  },
  insightsDivider: {
    height: 1,
    backgroundColor: colors.neutral[200],
    marginBottom: spacing.md,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  insightsTitle: {
    ...typography.heading.heading2,
    color: colors.primary.blue500,
    fontFamily: fonts.semibold,
    flex: 1,
  },
  insightsToggle: {
    color: colors.text.tertiary,
    fontFamily: fonts.semibold,
    fontSize: 26,
    lineHeight: 26,
  },
  insightText: {
    ...typography.body.small,
    color: colors.text.secondary,
    fontFamily: fonts.semibold,
    lineHeight: 20,
  },
});
