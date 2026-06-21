import { useMemo, useRef, useState } from 'react';
import { Alert, Animated, Easing, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { LockedScrim } from '../common/glass';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { buildGraphBpmValuePointsFromIbis } from '../../lib/heartRate/bpmSmoothing';
import { buildBpmSeries, type BpmTimePoint } from '../../lib/heartRate/bpmSeries';
import CardSurface from '../common/CardSurface';
import Icon from '../common/icons/Icon';

interface BPMChartProps {
  /** Inter-beat intervals (ms). Used when the source is raw beat detection. */
  ibiMs?: number[];
  /**
   * Pre-measured BPM-over-time samples. Used when the source already produced
   * beats-per-minute (e.g. breathing sessions, daily holds). Takes precedence
   * over `ibiMs` when both are provided.
   */
  bpmSamples?: BpmTimePoint[];
  height?: number;
  color?: string;
  locked?: boolean;
  onPressLocked?: () => void;
}

const PADDING = { top: 14, right: 8, bottom: 8, left: 8 };
const Y_TICK_HEIGHT = 14;

const BPM_INFO = {
  title: 'Heart Rate',
  message:
    'Your instantaneous beats per minute over the session, derived from each beat-to-beat interval (BPM = 60000 / RR).\n\nResting BPM typically falls between 60–90. Lower trends during a hold often reflect parasympathetic activation and good recovery.',
};

function buildBpmInsight(series: { tSec: number; bpm: number }[]): string | null {
  if (series.length < 2) return null;
  const values = series.map((p) => p.bpm);
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const min = Math.round(Math.min(...values));
  const max = Math.round(Math.max(...values));
  const range = max - min;

  const windowSize = Math.max(1, Math.floor(series.length * 0.15));
  const startAvg = values.slice(0, windowSize).reduce((a, b) => a + b, 0) / windowSize;
  const endAvg = values.slice(-windowSize).reduce((a, b) => a + b, 0) / windowSize;
  const drop = Math.round(startAvg - endAvg);

  const zoneDesc =
    avg <= 55
      ? `${avg} bpm is an excellent resting rate — typically seen in well-trained or highly recovered individuals`
      : avg <= 70
        ? `${avg} bpm sits in a strong resting range, reflecting good cardiovascular health`
        : avg <= 85
          ? `${avg} bpm is within a normal resting range for most adults`
          : `${avg} bpm is on the higher side for a resting measurement — hydration, stress, and caffeine can all push this up`;

  const rangeDesc =
    range <= 8
      ? `The narrow ${min}–${max} bpm window points to a well-regulated, stable session`
      : range <= 18
        ? `A ${min}–${max} bpm spread is normal — your heart was adapting naturally throughout`
        : `The wider ${min}–${max} bpm range suggests your heart was actively responding to something, whether that's breathing pattern, movement, or nervous system shifts`;

  if (drop >= 6) {
    return `A ${drop} bpm drop over your session is a good sign — your parasympathetic nervous system engaged and guided your body toward a calmer state. ${zoneDesc}. ${rangeDesc}.`;
  }
  if (drop <= -6) {
    return `Your heart rate climbed ${Math.abs(drop)} bpm over the session, which can happen when you're fatigued, under-recovered, or slightly dehydrated. ${zoneDesc}. If this pattern repeats, take a closer look at sleep and stress.`;
  }
  return `Your heart rate stayed consistent throughout — a sign of a stable, well-regulated session. ${zoneDesc}. ${rangeDesc}.`;
}

export default function BPMChart({
  ibiMs,
  bpmSamples,
  height = 170,
  color = colors.error[500],
  locked = false,
  onPressLocked,
}: BPMChartProps) {
  const [width, setWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w !== width) setWidth(w);
  };

  const series = useMemo(() => {
    if (bpmSamples && bpmSamples.length >= 2) {
      const points = buildBpmSeries(bpmSamples).points;
      if (points.length < 2) return [];
      const firstOffsetMs = points[0].offsetMs;
      return points.map((point) => ({
        tSec: (point.offsetMs - firstOffsetMs) / 1000,
        bpm: point.bpm,
      }));
    }
    if (!ibiMs || ibiMs.length < 2) return [];
    let t = 0;
    const ibiSamples = ibiMs.map((ms) => {
      t += ms;
      return { offsetMs: t, ibiMs: ms };
    });
    const points = buildGraphBpmValuePointsFromIbis(
      ibiSamples,
      (sample) => `${Math.round(sample.offsetMs / 1000)}s`,
    );
    const firstOffsetMs = points[0]?.offsetMs ?? 0;

    return points.map((point) => ({
      tSec: (point.offsetMs - firstOffsetMs) / 1000,
      bpm: point.value,
    }));
  }, [ibiMs, bpmSamples]);

  const durationSec = useMemo(
    () => (series.length > 0 ? Math.round(series[series.length - 1].tSec) : 0),
    [series],
  );

  const yBounds = useMemo(() => {
    if (series.length < 2) return null;
    const values = series.map((p) => p.bpm);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    return {
      pMax: max + range * 0.15,
      pMin: min - range * 0.15,
    };
  }, [series]);

  const chart = useMemo(() => {
    if (width <= 0 || series.length < 2 || !yBounds) return null;
    const pRange = yBounds.pMax - yBounds.pMin;
    const totalT = series[series.length - 1].tSec || 1;

    const innerW = width - PADDING.left - PADDING.right;
    const innerH = height - PADDING.top - PADDING.bottom;

    const points = series.map((p) => {
      const x = PADDING.left + (p.tSec / totalT) * innerW;
      const y = PADDING.top + (1 - (p.bpm - yBounds.pMin) / pRange) * innerH;
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
  }, [series, width, height, yBounds]);

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

  const bpmInsight = useMemo(() => buildBpmInsight(series), [series]);
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
          onPress={() => Alert.alert(BPM_INFO.title, BPM_INFO.message)}
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
        <Icon name="heart-plain" size={28} color={colors.error[500]} />
        <Text style={styles.title}>Heart rate</Text>
      </View>

      {!chart ? (
        <View style={[styles.emptyChart, { height }]} onLayout={onLayout}>
          <Text style={styles.emptyText}>
            Complete a full 90s heart rate measuring to see your BPM.
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
                  fill={colors.error[500]}
                  opacity={0.18}
                />
                <Circle
                  cx={chart.last.x}
                  cy={chart.last.y}
                  r={3}
                  fill={colors.error[500]}
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
      {chart && !locked && bpmInsight ? (
        <View style={styles.insightsSection}>
          <View style={styles.insightsDivider} />
          <Pressable style={styles.insightsHeader} onPress={toggleInsight}>
            <Icon name="sparkle" size={16} color={colors.error[500]} />
            <Text style={styles.insightsTitle}>Insights</Text>
            <Text style={styles.insightsToggle}>{insightExpanded ? '−' : '+'}</Text>
          </Pressable>
          <Animated.View style={{ maxHeight: animMaxHeight, overflow: 'hidden' }}>
            <Text style={styles.insightText}>{bpmInsight}</Text>
          </Animated.View>
        </View>
      ) : null}
      {locked ? (
        <>
          <LockedScrim />
          <View style={[styles.titleRow, styles.clearTitle]}>
            <Icon name="heart-plain" size={28} color={colors.error[500]} />
            <Text style={styles.title}>Heart rate</Text>
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
    ...typography.body.medium,
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
    ...typography.label.medium,
    color: colors.error[500],
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
    ...typography.body.medium,
    color: colors.text.secondary,
    fontFamily: fonts.semibold,
    lineHeight: 20,
  },
});
