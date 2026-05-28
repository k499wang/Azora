import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { card } from '../../theme/card';
import {
  RESTING_HR_AXIS_MAX,
  RESTING_HR_AXIS_MIN,
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
  const markerColor = zone?.color ?? colors.text.tertiary;

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
        <View style={styles.markerTrack}>
          {fraction != null ? (
            <View style={[styles.markerColumn, { left: `${fraction * 100}%` }]}>
              <View style={[styles.triangle, { borderTopColor: markerColor }]} />
            </View>
          ) : null}
        </View>

        <View style={[styles.bar, !hasBpm && styles.barEmpty]}>
          {segments.map((segment) => (
            <View
              key={segment.zone}
              style={{ flex: segment.flex, backgroundColor: segment.color }}
            />
          ))}
        </View>

        <View style={styles.axisRow}>
          <Text style={styles.axisLabel}>{RESTING_HR_AXIS_MIN}</Text>
          {showValue ? null : (
            <Text style={styles.axisValue}>
              {hasBpm ? `${Math.round(bpm!)} bpm` : '-- bpm'}
            </Text>
          )}
          <Text style={styles.axisLabel}>{RESTING_HR_AXIS_MAX}</Text>
        </View>
      </View>
    </View>
  );
}

const TRIANGLE_HALF_WIDTH = 7;

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
    paddingVertical: 2,
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
    gap: 2,
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
  },
  markerTrack: {
    width: '100%',
    height: 9,
  },
  markerColumn: {
    position: 'absolute',
    bottom: 0,
    marginLeft: -TRIANGLE_HALF_WIDTH,
    alignItems: 'center',
  },
  triangle: {
    width: 0,
    height: 0,
    borderLeftWidth: TRIANGLE_HALF_WIDTH,
    borderRightWidth: TRIANGLE_HALF_WIDTH,
    borderTopWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    width: '100%',
    height: 12,
    borderRadius: 999,
    marginTop: 2,
    overflow: 'hidden',
  },
  barEmpty: {
    opacity: 0.4,
  },
  axisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  axisLabel: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
    fontFamily: fonts.semibold,
    fontVariant: ['tabular-nums'],
  },
  axisValue: {
    ...typography.body.small,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontVariant: ['tabular-nums'],
  },
});
