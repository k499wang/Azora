import { Text } from '../../../../components/common/Text';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../../../theme/colors';
import { fonts } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';

const BEST_MARKER_FRACTION = 0.75;
const FALLBACK_SCALE_SECONDS = 60;

// One colour has to carry the best marker across all four exercise themes, so
// it is the brand's counter-hue rather than any theme's own accent. Yellow was
// washing out against the light canvas and fighting the blue character under
// it; orange holds on both the light and the three dark screens.
const BEST_COLOR = colors.orange[600];

interface Props {
  holdSeconds: number;
  bestSeconds: number;
  trackColor: string;
  fillColor: string;
}

export function formatHoldTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * The elapsed time itself is the session headline now, so this is only the
 * track: how far along you are and where your best sits.
 */
export default function HoldProgressBar({
  holdSeconds,
  bestSeconds,
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

  const activeFill = pastBest ? BEST_COLOR : fillColor;

  return (
    <View style={styles.wrap}>
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
          <View style={[styles.marker, { left: `${markerPct * 100}%` }]} />
        ) : null}
      </View>
      {hasBest ? (
        <Text style={[styles.bestLabel, pastBest && styles.bestLabelPast]}>
          Best {formatHoldTime(bestSeconds)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: spacing.xs,
    alignItems: 'flex-end',
  },
  bestLabel: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 12,
    letterSpacing: 0.6,
    color: BEST_COLOR,
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
    backgroundColor: BEST_COLOR,
  },
});
