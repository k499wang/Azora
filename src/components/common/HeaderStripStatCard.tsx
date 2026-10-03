import { Children, type ReactNode, type Ref } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import Icon, { type IconName } from './icons/Icon';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

const ICON_SIZE = 26;
const COIN_ICON = { name: 'coin', color: colors.reward.gold } as const;

const FRAME_WIDTH = 3;

const TONES = {
  amber: colors.playful.amber.base,
  sky: colors.playful.sky.mid,
} as const;

export type HeaderStripTone = keyof typeof TONES;

interface Props {
  label: string;
  value: string;
  tone: HeaderStripTone;
  icon?: { name: IconName; color: string };
  accessibilityLabel?: string;
  /** measured as the point anything earned flies from */
  ref?: Ref<View>;
}

/** One number under a coloured header strip naming it. */
export default function HeaderStripStatCard({
  label,
  value,
  tone,
  icon,
  accessibilityLabel = `${label} ${value}`,
  ref,
}: Props) {
  return (
    <View
      ref={ref}
      collapsable={false}
      style={[styles.card, { backgroundColor: TONES[tone] }]}
      accessible
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={styles.label}>{label}</Text>
      <View style={styles.body}>
        {icon == null ? null : (
          <Icon name={icon.name} size={ICON_SIZE} color={icon.color} />
        )}
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

/** The coins just earned, the card they fly from. */
export function EarnedCoinsCard({ coins, ref }: { coins: number; ref?: Ref<View> }) {
  return (
    <HeaderStripStatCard
      ref={ref}
      label="Coins"
      value={`${coins}`}
      tone="amber"
      icon={COIN_ICON}
      accessibilityLabel={`${coins} coins earned`}
    />
  );
}

/** Cards side by side, sharing the width equally. */
export function HeaderStripStatRow({ children }: { children: ReactNode }) {
  return (
    <View style={styles.row}>
      {Children.toArray(children).map((child, index) => (
        <View key={index} style={styles.cell}>
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card.shadow,
    borderRadius: radius.medium,
    borderCurve: 'continuous',
    padding: FRAME_WIDTH,
  },
  label: {
    ...typography.label.large,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
    textAlign: 'center',
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs + FRAME_WIDTH,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: ICON_SIZE + spacing.md * 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.small,
    borderCurve: 'continuous',
    backgroundColor: colors.background.card,
  },
  value: {
    ...typography.title.title3,
    color: colors.text.primary,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cell: {
    flex: 1,
  },
});
