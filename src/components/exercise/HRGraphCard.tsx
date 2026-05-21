import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { card } from '../../theme/card';
import LineGraph, { type DataPoint } from '../analytics/LineGraph';
import { smoothBpmValuePoints } from '../../lib/heartRate/bpmSmoothing';

interface HRSample {
  offsetMs: number;
  bpm: number;
}

interface HRGraphCardProps {
  samples: HRSample[];
  durationSec: number;
  maxPoints?: number;
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function windowMedianDownsample(samples: HRSample[], maxPoints: number): DataPoint[] {
  if (samples.length === 0) return [];

  if (samples.length <= maxPoints) {
    return smoothBpmValuePoints(
      samples.map((s) => ({
        label: formatTime(s.offsetMs / 1000),
        value: Math.round(s.bpm),
      })),
    );
  }

  const step = (samples.length - 1) / (maxPoints - 1);
  const windowRadius = Math.max(1, Math.floor(step / 2));
  const points: DataPoint[] = [];

  for (let i = 0; i < maxPoints; i += 1) {
    const centerIdx = Math.round(i * step);
    const start = Math.max(0, centerIdx - windowRadius);
    const end = Math.min(samples.length, centerIdx + windowRadius + 1);
    const windowSamples = samples.slice(start, end);

    const bpms = windowSamples.map((s) => s.bpm).sort((a, b) => a - b);
    const medianBpm = bpms[Math.floor(bpms.length / 2)];
    const centerSample = samples[centerIdx];

    points.push({
      label: formatTime(centerSample.offsetMs / 1000),
      value: Math.round(medianBpm),
    });
  }

  // Apply 2 BPM point-to-point clamp for calmer graph curves
  return smoothBpmValuePoints(points);
}

export default function HRGraphCard({
  samples,
  durationSec: _durationSec,
  maxPoints = 24,
}: HRGraphCardProps) {
  const data = useMemo(() => windowMedianDownsample(samples, maxPoints), [samples, maxPoints]);

  return (
    <View style={styles.graphCard}>
      <Text style={styles.graphTitle}>Heart rate</Text>
      <LineGraph
        data={data}
        unit=""
        height={180}
        lineColor={colors.primary.blue500}
        fillColor={colors.primary.blue100}
        dotColor={colors.primary.blue600}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  graphCard: {
    ...card.base,
    ...card.shadow,
    width: '100%',
    padding: spacing.md,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  graphTitle: {
    ...typography.heading.heading1,
    color: colors.text.secondary,
    fontFamily: fonts.semibold,
    marginBottom: spacing.xs,
  },
});
