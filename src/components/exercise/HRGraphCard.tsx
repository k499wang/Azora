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

function downsample(samples: HRSample[], maxPoints: number): DataPoint[] {
  if (samples.length === 0) return [];
  let points: DataPoint[];
  if (samples.length <= maxPoints) {
    points = samples.map((s) => ({
      label: formatTime(s.offsetMs / 1000),
      value: Math.round(s.bpm),
    }));
  } else {
    const step = (samples.length - 1) / (maxPoints - 1);
    points = [];
    for (let i = 0; i < maxPoints; i += 1) {
      const s = samples[Math.round(i * step)];
      points.push({ label: formatTime(s.offsetMs / 1000), value: Math.round(s.bpm) });
    }
  }
  // Apply 3 BPM point-to-point clamp for calmer graph curves
  return smoothBpmValuePoints(points);
}

export default function HRGraphCard({
  samples,
  durationSec: _durationSec,
  maxPoints = 24,
}: HRGraphCardProps) {
  const data = useMemo(() => downsample(samples, maxPoints), [samples, maxPoints]);

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
