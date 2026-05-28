import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { card } from '../../theme/card';
import {
  getRestingHeartRateMarkerFraction,
  getRestingHeartRateSegments,
  getRestingHeartRateZone,
} from '../../lib/heartRate/restingHeartRate';

interface RestingHeartRateBarProps {
  bpm: number | null;
  age: number | null;
  title?: string;
  showValue?: boolean;
}

const NUM_TICKS = 56;
const TICK_WIDTH = 2;
const TICK_SELECTED_OPACITY = 1;
const TICK_UNSELECTED_OPACITY = 0.26;

interface TickMark {
  t: number;
  color: string;
}

function buildTickMarks(segments: ReturnType<typeof getRestingHeartRateSegments>): TickMark[] {
  let acc = 0;
  const bounds = segments.map((segment) => {
    acc += segment.flex;
    return { max: acc, color: segment.color };
  });
  return Array.from({ length: NUM_TICKS }, (_, i) => {
    const t = i / (NUM_TICKS - 1);
    const band = bounds.find((b) => t <= b.max) ?? bounds[bounds.length - 1];
    return { t, color: band.color };
  });
}

export default function RestingHeartRateBar({
  bpm,
  age,
  title = 'Resting heart rate',
  showValue = true,
}: RestingHeartRateBarProps) {
  const hasBpm = bpm != null && Number.isFinite(bpm);
  const zone = hasBpm ? getRestingHeartRateZone(bpm!, age) : null;
  const fraction = hasBpm ? getRestingHeartRateMarkerFraction(bpm!) : null;
  const segments = getRestingHeartRateSegments(age);
  const ticks = buildTickMarks(segments);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {zone ? (
          <View style={[styles.zonePill, { backgroundColor: `${zone.color}18` }]}>
            <Text style={[styles.zoneText, { color: zone.color }]}>{zone.label}</Text>
          </View>
        ) : (
          <View style={[styles.zonePill, styles.zonePillEmpty]}>
            <Text style={[styles.zoneText, styles.zoneTextEmpty]}>No data</Text>
          </View>
        )}
      </View>

      {showValue ? (
        <View style={styles.valueRow}>
          <Text style={styles.value}>{hasBpm ? Math.round(bpm!) : '--'}</Text>
          <Text style={styles.unit}>bpm</Text>
        </View>
      ) : null}

      <View style={styles.barWrap}>
        <View style={[styles.tickTrack, !hasBpm && styles.tickTrackEmpty]}>
          {ticks.map((tick, i) => (
            <View
              key={i}
              style={[
                styles.tick,
                {
                  left: `${tick.t * 100}%`,
                  backgroundColor: tick.color,
                  opacity:
                    fraction != null && tick.t > fraction
                      ? TICK_UNSELECTED_OPACITY
                      : TICK_SELECTED_OPACITY,
                },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card.base,
    ...card.shadow,
    width: '100%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.heading.heading2,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontSize: 18,
  },
  zonePill: {
    borderRadius: 20,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  zoneText: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    fontSize: 11,
  },
  zonePillEmpty: {
    backgroundColor: colors.neutral[100],
  },
  zoneTextEmpty: {
    color: colors.text.tertiary,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    ...typography.title.title1,
    fontFamily: fonts.medium,
    fontWeight: '500',
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  unit: {
    ...typography.label.small,
    fontSize: 14,
    color: colors.text.tertiary,
    fontFamily: fonts.semibold,
  },
  barWrap: {
    width: '100%',
    marginTop: spacing.xs,
  },
  tickTrack: {
    position: 'relative',
    width: '100%',
    height: 16,
    marginTop: 2,
  },
  tickTrackEmpty: {
    opacity: 0.4,
  },
  tick: {
    position: 'absolute',
    top: 0,
    width: TICK_WIDTH,
    height: '100%',
    marginLeft: -TICK_WIDTH / 2,
    borderRadius: 999,
  },
});
