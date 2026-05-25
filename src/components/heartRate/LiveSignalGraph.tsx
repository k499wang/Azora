import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < samples.length; i++) {
    const v = samples[i].value;
    if (v < min) min = v;
    if (v > max) max = v;
  }

  const instantRange = Math.max(max - min, MIN_SIGNAL_RANGE);
  let rangeEma = prevRangeEma > 0 ? prevRangeEma : instantRange;
  rangeEma = rangeEma * 0.88 + instantRange * 0.12;

  const center = (min + max) / 2;
  const scale = height * 0.42;
  const getY = (v: number) => height / 2 - ((v - center) / rangeEma) * scale;
  const getX = (t: number) =>
    Math.max(0, Math.min(width, ((t - startTimestamp) / SIGNAL_WINDOW_MS) * width));

  const path = Skia.Path.Make();
  path.moveTo(getX(samples[0].timestamp), getY(samples[0].value));
  for (let i = 1; i < samples.length; i++) {
    path.lineTo(getX(samples[i].timestamp), getY(samples[i].value));
  }

  return { path, rangeEma };
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
  const [renderTick, setRenderTick] = useState(0);

  const samplesRef = useRef(samples);
  const lastTimestampRef = useRef(0);
  const rangeEmaRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  samplesRef.current = samples;

  useEffect(() => {
    const latest = samplesRef.current;
    const lastTs = latest[latest.length - 1]?.timestamp ?? 0;

    if (lastTs === lastTimestampRef.current) return;
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
  const signalGood = fingerPlacement === 'good';

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
          <Animated.Text
            style={[
              styles.bpmNumber,
              { color: numberColor },
              dim ? null : { opacity: bpmOpacity },
            ]}
          >
            {overlayBpm}
          </Animated.Text>
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
    gap: 8,
    marginBottom: spacing.xs,
  },
  bpmRowDim: {
    opacity: 0.25,
  },
  bpmNumber: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: 0.5,
  },
});
