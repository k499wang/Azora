import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import GlassSurface from './GlassSurface';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { pressable } from '../../theme/pressable';
import { spacing } from '../../theme/spacing';
import { fonts } from '../../theme/typography';
import { triggerTapHaptic } from '../../native/tapHaptics';

export type StatChipSize = 'regular' | 'compact';
export type StatChipSurface = 'glass' | 'scrim';

interface Props {
  /** the mark beside the number — sized by the caller for `size` */
  mark: ReactNode;
  value: number;
  accessibilityLabel: string;
  onPress?: () => void;
  size?: StatChipSize;
  surface?: StatChipSurface;
}

/** A number with its mark, in the pill a title row carries at its trailing edge. */
export default function StatChip({
  mark,
  value,
  accessibilityLabel,
  onPress,
  size = 'regular',
  surface = 'glass',
}: Props) {
  const compact = size === 'compact';
  const content = (
    <View style={[styles.row, compact && styles.rowCompact]}>
      {mark}
      <Text
        style={[
          styles.value,
          compact && styles.valueCompact,
          surface === 'scrim' && styles.valueOnScrim,
        ]}
      >
        {value}
      </Text>
    </View>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={() => {
        if (onPress == null) return;
        triggerTapHaptic();
        onPress();
      }}
      hitSlop={12}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      {surface === 'scrim' ? (
        <View style={[styles.pill, styles.pillScrim, compact && styles.pillCompact]}>
          {content}
        </View>
      ) : (
        <View style={styles.shadow}>
          <GlassSurface
            bare
            interactive
            style={[styles.pill, compact && styles.pillCompact]}
          >
            {content}
          </GlassSurface>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  shadow: {
    ...card.shadowElevated,
    borderRadius: radius.large,
    borderCurve: 'continuous',
  },
  pill: {
    borderRadius: radius.large,
    borderCurve: 'continuous',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glass.edge,
  },
  pillScrim: {
    backgroundColor: colors.onBlock.scrim,
    borderColor: 'transparent',
  },
  pillCompact: {
    borderRadius: radius.medium,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    height: 40,
  },
  rowCompact: {
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    height: 30,
  },
  pressed: pressable.control,
  value: {
    fontFamily: fonts.semibold,
    fontSize: 20,
    lineHeight: 24,
    color: colors.neutral[900],
    fontVariant: ['tabular-nums'],
  },
  valueOnScrim: {
    color: colors.text.inverse,
  },
  valueCompact: {
    fontSize: 16,
    lineHeight: 20,
  },
});
