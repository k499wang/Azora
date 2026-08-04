import { Text } from '../common/Text';
import { Pressable, StyleSheet, View } from 'react-native';
import { LockedScrim } from '../common/glass';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography, fonts } from '../../theme/typography';
import { card } from '../../theme/card';
import CardSurface from '../common/CardSurface';
import Icon from '../common/icons/Icon';
import type { IconName } from '../common/icons/paths';
import type { PlayfulHue } from '../../features/exercise/guidedBreathing/categoryPalette';

const STAT_ICON_SIZE = 24;

interface ThermometerStatCardProps {
  label: string;
  value: number | null | undefined;
  unit: string;
  min: number;
  max: number;
  icon?: IconName;
  iconColor?: string;
  hue?: PlayfulHue;
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
  icon,
  iconColor = colors.text.inverse,
  hue = colors.playful.coral,
  valueText,
  locked = false,
  onPressLocked,
}: ThermometerStatCardProps) {
  const hasValue = value != null && Number.isFinite(value);
  const magnitude = hasValue ? Math.abs(value!) : null;
  const clamped = magnitude != null ? Math.max(min, Math.min(max, magnitude)) : null;
  const fillPct = clamped != null ? ((clamped - min) / (max - min)) * 100 : 0;

  return (
    <CardSurface
      locked={locked}
      hue={hue}
      containerStyle={styles.tileContainer}
      style={styles.tile}
    >
      <View style={[styles.tileHeader, locked && styles.lockedTitleText]}>
        {icon ? (
          <Icon name={icon} size={STAT_ICON_SIZE} color={iconColor} />
        ) : null}
        <Text style={styles.tileLabel}>{label}</Text>
      </View>
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
          <View style={[styles.thermoFill, { height: `${fillPct}%` }]} />
        </View>
      </View>
      {locked ? (
        <>
          <LockedScrim />
          <View style={styles.tileHeader}>
            {icon ? (
              <Icon name={icon} size={STAT_ICON_SIZE} color={iconColor} />
            ) : null}
            <Text style={styles.tileLabel}>{label}</Text>
          </View>
          {onPressLocked ? (
            <Pressable
              accessibilityRole="button"
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
  tileContainer: {
    flex: 1,
  },
  tile: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginLeft: -spacing.xs,
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
    minHeight: 92,
  },
  tileBody: {
    flex: 1,
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  tileLabel: {
    ...typography.heading.heading2,
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: colors.text.inverse,
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
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  tileUnit: {
    ...typography.label.small,
    fontSize: 14,
    color: colors.onBlock.textMuted,
    fontFamily: fonts.regular,
    fontWeight: '400',
  },
  thermoTrack: {
    ...card.well,
    backgroundColor: colors.onBlock.fill,
    width: 10,
    height: 80,
    borderRadius: 5,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignSelf: 'center',
  },
  thermoFill: {
    width: '100%',
    borderRadius: 5,
    backgroundColor: colors.text.inverse,
  },
});
