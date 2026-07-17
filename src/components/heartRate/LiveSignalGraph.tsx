import { AnimatedText } from '../common/Text';
import React, {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Animated, LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts } from '../../theme/typography';
import type { FingerPlacementState, LivePpgSignalSample } from '../../lib/heartRate/types';

interface LiveSignalGraphProps {
  samples: LivePpgSignalSample[];
  fingerPlacement: FingerPlacementState;
  bpm?: number | null;
  beatTick?: number;
  textColor?: string;
  showLine?: boolean;
}

const GRAPH_HEIGHT = 78;
const SIGNAL_WINDOW_MS = 6000;
// Samples arrive gain-normalized from HeartRateManager (ac / amplitude EMA), so
// a real pulse spans roughly ±1-3. This floor keeps near-flat noise from being
// autoscaled to full height, mirroring the old 0.002 floor in raw-ac units.
const MIN_SIGNAL_RANGE = 1.5;
const GRAPH_POINT_COUNT = 48;
// Above the max samples a window can hold (SIGNAL_WINDOW_MS x sensor fps), so the
// triangle downsampler stays off during normal scroll. It reselects different
// vertices as its buckets slide over the data, which shows as vertical jitter.
const MAX_GRAPH_DRAW_POINTS = 240;
const GRAPH_VERTICAL_PADDING = 3;
const SIGNAL_RENDER_FRAME_MS = 33;
const SIGNAL_PLAYBACK_DELAY_MS = 300;
const SIGNAL_VERTICAL_GAIN = 1.35;
const RANGE_GROW_ALPHA = 0.12;
const RANGE_SHRINK_ALPHA = 0.06;
const SCALE_LOCK_MIN_SPAN_MS = 1000;
const SCALE_LOW_PERCENTILE = 0.12;
const SCALE_HIGH_PERCENTILE = 0.88;
const SIGNAL_DISPLAY_CENTER = 0;

interface SignalScale {
  rangeEma: number;
  scaleReady: boolean;
}

interface GraphPoint {
  x: number;
  y: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function percentile(sortedValues: number[], ratio: number): number {
  if (sortedValues.length === 0) return 0;
  const index = Math.round((sortedValues.length - 1) * ratio);
  return sortedValues[clamp(index, 0, sortedValues.length - 1)];
}

function buildFlatSignalPath(width: number, height: number): ReturnType<typeof Skia.Path.Make> {
  const path = Skia.Path.Make();
  const y = height / 2;
  path.moveTo(0, y);
  for (let i = 1; i < GRAPH_POINT_COUNT; i++) {
    path.lineTo((i / (GRAPH_POINT_COUNT - 1)) * width, y);
  }
  return path;
}

function sampleInterpolatedValue(
  samples: LivePpgSignalSample[],
  targetTimestamp: number,
): number {
  if (samples.length === 0) return 0;

  if (targetTimestamp <= samples[0].timestamp) {
    return samples[0].value;
  }

  let sourceIndex = 0;
  while (
    sourceIndex < samples.length - 2 &&
    samples[sourceIndex + 1].timestamp < targetTimestamp
  ) {
    sourceIndex += 1;
  }

  const current = samples[sourceIndex];
  const next = samples[sourceIndex + 1];
  if (next == null || next.timestamp <= current.timestamp) {
    return current.value;
  }

  const ratio = Math.max(
    0,
    Math.min(1, (targetTimestamp - current.timestamp) / (next.timestamp - current.timestamp)),
  );
  return current.value + (next.value - current.value) * ratio;
}

function capGraphPoints(points: GraphPoint[], maxPointCount: number): GraphPoint[] {
  if (points.length <= maxPointCount) return points;
  if (maxPointCount < 3) return [points[0], points[points.length - 1]];

  const cappedPoints: GraphPoint[] = [points[0]];
  const bucketSize = (points.length - 2) / (maxPointCount - 2);
  let anchorIndex = 0;

  for (let bucketIndex = 0; bucketIndex < maxPointCount - 2; bucketIndex++) {
    const bucketStart = Math.floor(bucketIndex * bucketSize) + 1;
    const bucketEnd = Math.floor((bucketIndex + 1) * bucketSize) + 1;
    const nextBucketStart = Math.floor((bucketIndex + 1) * bucketSize) + 1;
    const nextBucketEnd = Math.floor((bucketIndex + 2) * bucketSize) + 1;

    const averageStart = Math.min(nextBucketStart, points.length - 1);
    const averageEnd = Math.min(nextBucketEnd, points.length);
    let averageX = 0;
    let averageY = 0;
    let averageCount = 0;

    for (let i = averageStart; i < averageEnd; i++) {
      averageX += points[i].x;
      averageY += points[i].y;
      averageCount += 1;
    }

    if (averageCount === 0) {
      averageX = points[points.length - 1].x;
      averageY = points[points.length - 1].y;
      averageCount = 1;
    }

    averageX /= averageCount;
    averageY /= averageCount;

    const anchor = points[anchorIndex];
    let selectedIndex = bucketStart;
    let largestArea = -1;

    for (let i = bucketStart; i < Math.min(bucketEnd, points.length - 1); i++) {
      const point = points[i];
      const area = Math.abs(
        (anchor.x - averageX) * (point.y - anchor.y) -
          (anchor.x - point.x) * (averageY - anchor.y),
      );

      if (area > largestArea) {
        largestArea = area;
        selectedIndex = i;
      }
    }

    cappedPoints.push(points[selectedIndex]);
    anchorIndex = selectedIndex;
  }

  cappedPoints.push(points[points.length - 1]);
  return cappedPoints;
}

function updateSignalScale(
  samples: LivePpgSignalSample[],
  anchorTimestamp: number,
  prevRangeEma: number,
  scaleReady: boolean,
): SignalScale {
  if (samples.length < 2 || anchorTimestamp <= 0) {
    return {
      rangeEma: prevRangeEma,
      scaleReady,
    };
  }

  const startTimestamp = anchorTimestamp - SIGNAL_WINDOW_MS;
  const visibleSamples = samples.filter(
    (sample) => sample.timestamp >= startTimestamp && sample.timestamp <= anchorTimestamp,
  );
  const scaleSamples = visibleSamples.length >= 2 ? visibleSamples : samples;

  const finiteValues: number[] = [];
  for (let i = 0; i < scaleSamples.length; i++) {
    const value = scaleSamples[i].value;
    if (!Number.isFinite(value)) continue;
    finiteValues.push(value);
  }

  if (finiteValues.length < 2) {
    return {
      rangeEma: prevRangeEma,
      scaleReady,
    };
  }

  finiteValues.sort((a, b) => a - b);
  const low = percentile(finiteValues, SCALE_LOW_PERCENTILE);
  const high = percentile(finiteValues, SCALE_HIGH_PERCENTILE);
  const instantRange = Math.max(Math.max(Math.abs(low), Math.abs(high)) * 2, MIN_SIGNAL_RANGE);

  // Defer the first scale lock until the window spans enough time that a brief
  // finger-press transient can't define the scale on its own.
  if (!scaleReady || prevRangeEma <= 0) {
    const windowSpanMs =
      scaleSamples[scaleSamples.length - 1].timestamp - scaleSamples[0].timestamp;
    if (windowSpanMs < SCALE_LOCK_MIN_SPAN_MS) {
      return { rangeEma: prevRangeEma, scaleReady: false };
    }
    return { rangeEma: instantRange, scaleReady: true };
  }

  // Grow quickly to fit larger excursions, relax slowly when they pass, so an
  // early transient no longer permanently compresses later beats.
  const alpha = instantRange > prevRangeEma ? RANGE_GROW_ALPHA : RANGE_SHRINK_ALPHA;
  const rangeEma = Math.max(
    MIN_SIGNAL_RANGE,
    prevRangeEma * (1 - alpha) + instantRange * alpha,
  );

  return { rangeEma, scaleReady: true };
}

function buildSignalPath(
  samples: LivePpgSignalSample[],
  width: number,
  height: number,
  anchorTimestamp: number,
  rangeEma: number,
): ReturnType<typeof Skia.Path.Make> {
  if (samples.length < 2 || width <= 0 || anchorTimestamp <= 0 || rangeEma <= 0) {
    return buildFlatSignalPath(width, height);
  }

  const startTimestamp = anchorTimestamp - SIGNAL_WINDOW_MS;
  const pxPerMs = width / SIGNAL_WINDOW_MS;
  const scale = height * 0.42 * SIGNAL_VERTICAL_GAIN;
  const getY = (value: number) => {
    const y = height / 2 - ((value - SIGNAL_DISPLAY_CENTER) / rangeEma) * scale;
    if (!Number.isFinite(y)) return height / 2;
    return clamp(y, GRAPH_VERTICAL_PADDING, height - GRAPH_VERTICAL_PADDING);
  };

  const points: GraphPoint[] = [
    { x: 0, y: getY(sampleInterpolatedValue(samples, startTimestamp)) },
  ];

  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    if (sample.timestamp <= startTimestamp || sample.timestamp >= anchorTimestamp) continue;
    points.push({
      x: (sample.timestamp - startTimestamp) * pxPerMs,
      y: getY(sample.value),
    });
  }

  points.push({ x: width, y: getY(sampleInterpolatedValue(samples, anchorTimestamp)) });

  const cappedPoints = capGraphPoints(points, MAX_GRAPH_DRAW_POINTS);

  if (cappedPoints.length < 2) {
    return buildFlatSignalPath(width, height);
  }

  const path = Skia.Path.Make();
  path.moveTo(cappedPoints[0].x, cappedPoints[0].y);

  for (let i = 1; i < cappedPoints.length - 1; i++) {
    const current = cappedPoints[i];
    const next = cappedPoints[i + 1];
    path.quadTo(current.x, current.y, (current.x + next.x) / 2, (current.y + next.y) / 2);
  }

  const lastPoint = cappedPoints[cappedPoints.length - 1];
  path.lineTo(lastPoint.x, lastPoint.y);

  return path;
}

function LiveSignalGraphComponent({
  samples,
  fingerPlacement,
  bpm,
  beatTick,
  textColor,
  showLine = true,
}: LiveSignalGraphProps) {
  const [width, setWidth] = useState(0);
  const [linePath, setLinePath] = useState<ReturnType<typeof Skia.Path.Make> | null>(null);

  const samplesRef = useRef(samples);
  const rangeEmaRef = useRef(0);
  const scaleReadyRef = useRef(false);
  const latestSampleTimestampRef = useRef(0);
  const latestSampleReceivedAtRef = useRef(0);
  const renderedAnchorTimestampRef = useRef(0);
  const renderedWidthRef = useRef(0);
  const lastRenderAtRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  const isSignalAvailable =
    samples.length >= 2 &&
    fingerPlacement !== 'lost' &&
    fingerPlacement !== 'no_finger';
  const signalGood = fingerPlacement === 'good';

  useEffect(() => {
    const latestTimestamp = samples[samples.length - 1]?.timestamp ?? 0;
    samplesRef.current = samples;

    if (latestTimestamp !== latestSampleTimestampRef.current) {
      latestSampleTimestampRef.current = latestTimestamp;
      latestSampleReceivedAtRef.current = Date.now();

      const nextScale = updateSignalScale(
        samples,
        latestTimestamp,
        rangeEmaRef.current,
        scaleReadyRef.current,
      );
      rangeEmaRef.current = nextScale.rangeEma;
      scaleReadyRef.current = nextScale.scaleReady;
    }

    if (samples.length < 2) {
      scaleReadyRef.current = false;
    }
  }, [samples]);

  useEffect(() => {
    if (!showLine || width <= 0) return undefined;

    const renderSignalFrame = () => {
      const now = Date.now();

      if (now - lastRenderAtRef.current >= SIGNAL_RENDER_FRAME_MS) {
        lastRenderAtRef.current = now;

        const currentSamples = samplesRef.current;
        const latestTimestamp = latestSampleTimestampRef.current;

        if (currentSamples.length < 2 || latestTimestamp <= 0) {
          if (renderedWidthRef.current !== width || renderedAnchorTimestampRef.current !== 0) {
            setLinePath(buildFlatSignalPath(width, GRAPH_HEIGHT));
            renderedWidthRef.current = width;
            renderedAnchorTimestampRef.current = 0;
          }
        } else {
          const projectedLatestTimestamp =
            latestTimestamp + Math.max(0, now - latestSampleReceivedAtRef.current);
          const anchorTimestamp = Math.min(
            latestTimestamp,
            projectedLatestTimestamp - SIGNAL_PLAYBACK_DELAY_MS,
          );

          const shouldRenderSignal =
            anchorTimestamp > 0 &&
            (anchorTimestamp !== renderedAnchorTimestampRef.current ||
              renderedWidthRef.current !== width);

          if (shouldRenderSignal) {
            const path = buildSignalPath(
              currentSamples,
              width,
              GRAPH_HEIGHT,
              anchorTimestamp,
              rangeEmaRef.current,
            );

            renderedAnchorTimestampRef.current = anchorTimestamp;
            renderedWidthRef.current = width;
            setLinePath(path);
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(renderSignalFrame);
    };

    animationFrameRef.current = requestAnimationFrame(renderSignalFrame);

    return () => {
      if (animationFrameRef.current != null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [showLine, width]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    setWidth((currentWidth) =>
      Math.abs(currentWidth - nextWidth) < 1 ? currentWidth : nextWidth,
    );
  }, []);

  const bpmOpacity = useRef(new Animated.Value(0.6)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (beatTick == null || beatTick <= 0) return;
    bpmOpacity.setValue(0.95);
    Animated.timing(bpmOpacity, {
      toValue: 0.6,
      duration: 420,
      useNativeDriver: true,
    }).start();
    Animated.sequence([
      Animated.timing(heartScale, {
        toValue: 1.28,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(heartScale, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start();
  }, [beatTick, bpmOpacity, heartScale]);

  const overlayBpm = bpm != null && bpm > 0 ? Math.round(bpm) : null;
  const dim = !signalGood;
  const numberColor = textColor ?? colors.text.primary;

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {overlayBpm != null && (
        <View style={[styles.bpmRow, dim && styles.bpmRowDim]} pointerEvents="none">
          <AnimatedText
            style={[
              styles.bpmNumber,
              { color: numberColor },
              dim ? null : { opacity: bpmOpacity },
            ]}
          >
            {overlayBpm}
          </AnimatedText>
          <Animated.View style={dim ? null : { transform: [{ scale: heartScale }] }}>
            <MaterialCommunityIcons
              name="heart"
              size={18}
              color={dim ? colors.text.tertiary : colors.error[500]}
            />
          </Animated.View>
        </View>
      )}
      <View style={styles.graph}>
        {showLine && width > 0 && linePath != null && (
          <Canvas style={StyleSheet.absoluteFill}>
            <Path
              path={linePath}
              style="stroke"
              strokeWidth={1.5}
              strokeCap="round"
              strokeJoin="round"
              color={isSignalAvailable ? colors.primary.blue400 : colors.text.tertiary}
              opacity={isSignalAvailable ? 0.5 : 0.25}
            />
          </Canvas>
        )}
      </View>
    </View>
  );
}

export const LiveSignalGraph = memo(LiveSignalGraphComponent);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 360,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  graph: {
    width: '100%',
    height: GRAPH_HEIGHT,
    overflow: 'hidden',
  },
  bpmRow: {
    position: 'absolute',
    bottom: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  // Imperfect placement mutes the reading rather than hiding it: the number
  // must stay legible through the brief placement flaps that normal finger
  // pressure shifts cause, while still signalling reduced confidence.
  bpmRowDim: {
    opacity: 0.55,
  },
  bpmNumber: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: 0.5,
  },
});
