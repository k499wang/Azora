import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const BEST_MARKER_FRACTION = 0.75;
const FALLBACK_SCALE_SECONDS = 60;

interface Props {
  holdSeconds: number;
  bestSeconds: number;
  textColor: string;
  trackColor: string;
  fillColor: string;
}

function formatHoldTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function HoldProgressBar({
  holdSeconds,
  bestSeconds,
  textColor,
  trackColor,
  fillColor,
}: Props) {
  const hasBest = bestSeconds > 0;
  const pastBest = hasBest && holdSeconds >= bestSeconds;

  const { fillPct, markerPct } = useMemo(() => {
    const scale = hasBest
      ? bestSeconds / BEST_MARKER_FRACTION
      : FALLBACK_SCALE_SECONDS;
    return {
      fillPct: Math.min(1, holdSeconds / scale),
      markerPct: hasBest ? BEST_MARKER_FRACTION : null,
    };
  }, [bestSeconds, hasBest, holdSeconds]);

  const activeFill = pastBest ? colors.yellow[400] : fillColor;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={[styles.timer, { color: textColor }]}>
          {formatHoldTime(holdSeconds)}
        </Text>
        {hasBest ? (
          <Text style={[styles.bestLabel, pastBest && styles.bestLabelPast]}>
            Best {formatHoldTime(bestSeconds)}
          </Text>
        ) : null}
      </View>
      <View style={[styles.track, { backgroundColor: trackColor }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${fillPct * 100}%`,
              backgroundColor: activeFill,
            },
          ]}
        />
        {markerPct != null ? (
          <View
            style={[
              styles.marker,
              { left: `${markerPct * 100}%` },
            ]}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    paddingHorizontal: spacing.xl,
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  timer: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 16,
    letterSpacing: 0.6,
    fontVariant: ['tabular-nums'],
    opacity: 0.85,
  },
  bestLabel: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 12,
    letterSpacing: 0.6,
    color: colors.yellow[400],
    fontVariant: ['tabular-nums'],
    opacity: 0.85,
  },
  bestLabelPast: {
    opacity: 1,
  },
  track: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'visible',
    position: 'relative',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 3,
  },
  marker: {
    position: 'absolute',
    top: -3,
    bottom: -3,
    width: 2,
    marginLeft: -1,
    borderRadius: 1,
    backgroundColor: colors.yellow[400],
  },
});
