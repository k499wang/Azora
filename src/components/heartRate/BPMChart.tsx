import { useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { buildGraphBpmValuePointsFromIbis } from '../../lib/heartRate/bpmSmoothing';
import { buildBpmSeries, type BpmTimePoint } from '../../lib/heartRate/bpmSeries';
import {
  buildBpmInsight,
  type BpmInsightContext,
  type BpmInsightSummary,
} from '../../lib/heartRate/bpmInsight';
import CardSurface from '../common/CardSurface';
import FeatureInfoDialog from '../common/FeatureInfoDialog';
import LockedContentBlur from '../common/LockedContentBlur';
import Icon from '../common/icons/Icon';
import ChartInsightsSection from './ChartInsightsSection';

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
  insightSummary?: BpmInsightSummary;
  emptyMessage?: string;
  insightContext?: BpmInsightContext;
}

const PADDING = { top: 14, right: 8, bottom: 8, left: 8 };
const Y_TICK_HEIGHT = 14;

const BPM_INFO = {
  title: 'Heart Rate',
  message:
    'Your instantaneous beats per minute over the session, derived from each beat-to-beat interval (BPM = 60000 / RR).\n\nResting BPM typically falls between 60–90. Lower trends during a hold often reflect parasympathetic activation and good recovery.',
};

export default function BPMChart({
  ibiMs,
  bpmSamples,
  height = 170,
  color = colors.error[500],
  locked = false,
  onPressLocked,
  insightSummary,
  emptyMessage = 'Complete a full 90s heart rate measuring to see your BPM.',
  insightContext = 'resting',
}: BPMChartProps) {
  const [width, setWidth] = useState(0);
  const [infoVisible, setInfoVisible] = useState(false);

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

  const bpmInsight = useMemo(
    () => buildBpmInsight(series, insightSummary, insightContext),
    [insightContext, insightSummary, series],
  );
  return (
    <CardSurface locked={locked} style={styles.card}>
      {!locked ? (
        <>
          <Pressable
            hitSlop={10}
            onPress={() => setInfoVisible(true)}
            style={styles.infoButton}
          >
            <MaterialCommunityIcons
              name="information-outline"
              size={16}
              color={colors.text.tertiary}
            />
          </Pressable>
          <FeatureInfoDialog
            visible={infoVisible}
            onClose={() => setInfoVisible(false)}
            title={BPM_INFO.title}
            intro={BPM_INFO.message}
          />
        </>
      ) : null}
      <View style={styles.titleRow}>
        <Icon name="heart-plain" size={28} color={colors.error[500]} />
        <Text style={styles.title}>Heart rate</Text>
      </View>

      <LockedContentBlur locked={locked}>
        <View
          accessibilityElementsHidden={locked}
          importantForAccessibility={locked ? 'no-hide-descendants' : 'auto'}
        >
        {!chart ? (
        <View style={[styles.emptyChart, { height }]} onLayout={onLayout}>
          <Text style={styles.emptyText}>
            {emptyMessage}
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
        </View>
      </LockedContentBlur>
      <ChartInsightsSection
        accentColor={colors.error[500]}
        insight={chart ? bpmInsight : null}
        locked={locked}
        lockedPlaceholder={
          insightContext === 'breath-hold'
            ? 'Your heart rate slowed during the hold as your diving reflex engaged. Tracking this response over repeated holds can show how consistently your nervous system shifts toward oxygen conservation.'
            : "Your resting heart rate is tracking slightly below your weekly average, which typically signals good cardiovascular recovery. Today's peak of 112 bpm occurred during your afternoon session — well within your normal exertion range. Over the past 7 days, your recovery windows have been shortening, suggesting your body is adapting positively to recent activity."
        }
      />
      {locked ? (
        <>
          {onPressLocked ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Unlock heart rate insights"
              accessibilityHint="Opens the Pro upgrade screen"
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
});
