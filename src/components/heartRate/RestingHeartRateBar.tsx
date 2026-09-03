import { Text } from '../common/Text';
import { card } from '../../theme/card';
import { Pressable, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { LockedScrim } from '../common/glass';
import { colors } from '../../theme/colors';
import { typography, fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import CardSurface from '../common/CardSurface';
import type { CardSurfaceMode } from '../common/cardSurfaceConfig';
import CardTitle from '../common/CardTitle';
import PulseDot from '../common/PulseDot';
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
  surface?: CardSurfaceMode;
  emphasizeValue?: boolean;
  locked?: boolean;
  onPressLocked?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
}

const NUM_TICKS = 40;
const TICK_WIDTH = 4;
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
  surface,
  emphasizeValue = false,
  locked = false,
  onPressLocked,
  containerStyle,
  style,
}: RestingHeartRateBarProps) {
  const hasBpm = bpm != null && Number.isFinite(bpm);
  const zone = hasBpm ? getRestingHeartRateZone(bpm!, age) : null;
  const fraction = hasBpm ? getRestingHeartRateMarkerFraction(bpm!) : null;
  const segments = getRestingHeartRateSegments(age);
  const ticks = buildTickMarks(segments);

  return (
    <CardSurface
      locked={locked}
      containerStyle={containerStyle}
      style={[styles.card, style]}
      surface={surface}
    >
      <View
        accessibilityElementsHidden={locked}
        importantForAccessibility={locked ? 'no-hide-descendants' : 'auto'}
        style={styles.content}
      >
        <View style={locked && styles.hiddenLockedTitle}>
          <CardTitle
            title={title}
            color={colors.text.primary}
            leading={<PulseDot color={zone?.color} />}
            right={
              zone ? (
                <View style={[styles.zonePill, { backgroundColor: `${zone.color}18` }]}>
                  <Text style={[styles.zoneText, { color: zone.color }]}>
                    {zone.label}
                  </Text>
                </View>
              ) : null
            }
          />
        </View>

        {showValue ? (
          <View style={styles.valueRow}>
            <Text style={[styles.value, emphasizeValue && styles.emphasizedValue]}>
              {hasBpm ? Math.round(bpm!) : '--'}
            </Text>
            <Text style={[styles.unit, emphasizeValue && styles.emphasizedUnit]}>
              bpm
            </Text>
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
                    backgroundColor:
                      !hasBpm
                        ? colors.neutral[300]
                        : fraction != null && tick.t > fraction
                        ? colors.neutral[300]
                        : tick.color,
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

      {locked ? (
        <>
          <LockedScrim />
          <View style={styles.clearHeaderOverlay} pointerEvents="none">
            <CardTitle
              title={title}
              color={colors.text.primary}
              leading={<PulseDot />}
            />
          </View>
          {onPressLocked ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Unlock ${title.toLowerCase()}`}
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
    backgroundColor: colors.background.elevated,
    ...card.shadow,
    width: '100%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    position: 'relative',
  },
  content: {
    gap: spacing.sm,
  },
  clearHeaderOverlay: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    zIndex: 2,
  },
  hiddenLockedTitle: {
    opacity: 0,
  },
  zonePill: {
    borderRadius: 20,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  zoneText: {
    ...typography.label.small,
    fontFamily: fonts.medium,
    fontWeight: '500',
    fontSize: 11,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    ...typography.stat.valueMedium,
    color: colors.text.primary,
  },
  emphasizedValue: {
    ...typography.stat.valueLarge,
  },
  emphasizedUnit: {
    ...typography.stat.unitLarge,
  },
  unit: {
    ...typography.stat.unitMedium,
    color: colors.text.tertiary,
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
