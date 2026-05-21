import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { FingerPlacementState, LivePpgSignalSample } from '../../lib/heartRate/types';

interface LiveSignalGraphProps {
  samples: LivePpgSignalSample[];
  fingerPlacement: FingerPlacementState;
}

const GRAPH_HEIGHT = 78;
const SIGNAL_WINDOW_MS = 8000;
const MIN_SIGNAL_RANGE = 0.002;

interface PathBuildResult {
  path: ReturnType<typeof Skia.Path.Make>;
  rangeEma: number;
}

function buildFastSignalPath(
  samples: LivePpgSignalSample[],
  width: number,
  height: number,
  prevRangeEma: number,
): PathBuildResult {
  if (samples.length < 2 || width <= 0) {
    return { path: Skia.Path.Make(), rangeEma: prevRangeEma };
  }

  const lastTimestamp = samples[samples.length - 1].timestamp;
  const startTimestamp = lastTimestamp - SIGNAL_WINDOW_MS;

  // Single pass for min / max
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < samples.length; i++) {
    const v = samples[i].value;
    if (v < min) min = v;
    if (v > max) max = v;
  }

  // Stabilise vertical scale with a cheap EMA so the graph doesn't bounce
  const instantRange = Math.max(max - min, MIN_SIGNAL_RANGE);
  let rangeEma = prevRangeEma > 0 ? prevRangeEma : instantRange;
  rangeEma = rangeEma * 0.88 + instantRange * 0.12;

  const center = (min + max) / 2;
  const scale = height * 0.42;
  const getY = (v: number) => height / 2 - ((v - center) / rangeEma) * scale;
  const getX = (t: number) =>
    Math.max(0, Math.min(width, ((t - startTimestamp) / SIGNAL_WINDOW_MS) * width));

  // Fast path build: moveTo + lineTo for every sample
  const path = Skia.Path.Make();
  path.moveTo(getX(samples[0].timestamp), getY(samples[0].value));
  for (let i = 1; i < samples.length; i++) {
    path.lineTo(getX(samples[i].timestamp), getY(samples[i].value));
  }

  return { path, rangeEma };
}

function LiveSignalGraphComponent({ samples, fingerPlacement }: LiveSignalGraphProps) {
  const [width, setWidth] = useState(0);
  const [renderTick, setRenderTick] = useState(0);

  const samplesRef = useRef(samples);
  const lastTimestampRef = useRef(0);
  const rangeEmaRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  // Keep the latest samples in a ref so the RAF closure always reads fresh data
  samplesRef.current = samples;

  // Throttle expensive path rebuilds to the display refresh rate.
  // Even if samples arrive at 30–60 Hz, we only regenerate the Skia path once per
  // animation frame. Multiple sample updates in the same frame are coalesced.
  useEffect(() => {
    const latest = samplesRef.current;
    const lastTs = latest[latest.length - 1]?.timestamp ?? 0;

    // No new data since last drawn frame
    if (lastTs === lastTimestampRef.current) return;

    // Already scheduled for this frame
    if (rafRef.current != null) return;

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      lastTimestampRef.current = lastTs;
      setRenderTick((t) => t + 1);
    });

    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [samples]);

  const isSignalAvailable =
    samples.length >= 2 &&
    fingerPlacement !== 'lost' &&
    fingerPlacement !== 'no_finger';

  const linePath = useMemo(() => {
    if (width <= 0) return null;
    const result = buildFastSignalPath(
      samplesRef.current,
      width,
      GRAPH_HEIGHT,
      rangeEmaRef.current,
    );
    rangeEmaRef.current = result.rangeEma;
    return result.path;
  }, [renderTick, width]);

  const midlinePath = useMemo(() => {
    if (width <= 0) return null;
    const path = Skia.Path.Make();
    path.moveTo(0, GRAPH_HEIGHT / 2);
    path.lineTo(width, GRAPH_HEIGHT / 2);
    return path;
  }, [width]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    setWidth((currentWidth) =>
      Math.abs(currentWidth - nextWidth) < 1 ? currentWidth : nextWidth,
    );
  }, []);

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <View style={styles.graph}>
        {width > 0 && linePath != null && midlinePath != null && (
          <Canvas style={StyleSheet.absoluteFill}>
            <Path
              path={midlinePath}
              style="stroke"
              strokeWidth={1}
              color={colors.border.subtle}
            />
            <Path
              path={linePath}
              style="stroke"
              strokeWidth={2.5}
              strokeCap="round"
              strokeJoin="round"
              color={isSignalAvailable ? colors.primary.blue600 : colors.text.tertiary}
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
  },
  graph: {
    height: GRAPH_HEIGHT,
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: colors.background.secondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.subtle,
  },
});
