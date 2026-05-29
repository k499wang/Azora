import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography, fonts } from '../../theme/typography';
import { card } from '../../theme/card';

interface ThermometerStatCardProps {
  label: string;
  value: number | null | undefined;
  unit: string;
  min: number;
  max: number;
  accent: string;
  /** When set, renders this text as the primary black value and hides the grey unit. */
  valueText?: string;
  locked?: boolean;
  onPressLocked?: () => void;
}

export default function ThermometerStatCard({
  label,
  value,
  unit,
  min,
  max,
  accent,
  valueText,
  locked = false,
  onPressLocked,
}: ThermometerStatCardProps) {
  const hasValue = value != null && Number.isFinite(value);
  const magnitude = hasValue ? Math.abs(value!) : null;
  const clamped = magnitude != null ? Math.max(min, Math.min(max, magnitude)) : null;
  const fillPct = clamped != null ? ((clamped - min) / (max - min)) * 100 : 0;

  return (
    <View style={[styles.tile, locked && styles.lockedTile]}>
      <Text style={[styles.tileLabel, locked && styles.lockedTitleText]}>
        {label}
      </Text>
      <View style={styles.tileContent}>
        <View style={styles.tileBody}>
          <View style={styles.tileValueRow}>
            {valueText != null ? (
              <Text style={styles.tileValue}>{valueText}</Text>
            ) : (
              <>
                <Text style={styles.tileValue}>
                  {magnitude != null ? Math.round(magnitude) : '--'}
                </Text>
                <Text style={styles.tileUnit}>{unit}</Text>
              </>
            )}
          </View>
        </View>
        <View style={styles.thermoTrack}>
          <View
            style={[
              styles.thermoFill,
              { height: `${fillPct}%`, backgroundColor: accent },
            ]}
          />
        </View>
      </View>
      {locked ? (
        <>
          <BlurView
            intensity={24}
            tint="light"
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
          />
          <Text style={[styles.tileLabel, styles.clearTileLabel]}>{label}</Text>
          {onPressLocked ? (
            <Pressable
              accessibilityRole="button"
              onPress={onPressLocked}
              style={StyleSheet.absoluteFill}
            />
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    ...card.base,
    ...card.shadow,
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  lockedTile: {
    overflow: 'hidden',
  },
  clearTileLabel: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    zIndex: 2,
  },
  tileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: 16,
  },
  tileBody: {
    flex: 1,
    justifyContent: 'center',
  },
  tileLabel: {
    ...typography.heading.heading2,
    fontFamily: fonts.semibold,
    fontSize: 18,
    color: colors.text.primary,
  },
  lockedTitleText: {
    opacity: 0,
  },
  tileValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  tileValue: {
    fontSize: 28,
    lineHeight: 32,
    fontFamily: fonts.medium,
    fontWeight: '500',
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  tileUnit: {
    ...typography.label.small,
    fontSize: 12,
    color: colors.text.tertiary,
    fontFamily: fonts.semibold,
  },
  thermoTrack: {
    width: 10,
    height: 80,
    borderRadius: 5,
    backgroundColor: colors.neutral[100],
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  thermoFill: {
    width: '100%',
    borderRadius: 5,
  },
});
