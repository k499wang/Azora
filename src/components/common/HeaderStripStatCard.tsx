import { Children, type ReactNode, type Ref } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import Icon, { type IconName } from './icons/Icon';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

const ICON_SIZE = 30;
const COIN_ICON = { name: 'coin', color: colors.reward.gold } as const;

const TONES = {
  amber: { strip: colors.playful.amber.base, label: colors.playful.amber.ink },
  sky: { strip: colors.playful.sky.base, label: colors.text.inverse },
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
      style={styles.card}
      accessible
      accessibilityLabel={accessibilityLabel}
    >
      <View style={[styles.strip, { backgroundColor: TONES[tone].strip }]}>
        <Text style={[styles.label, { color: TONES[tone].label }]}>{label}</Text>
      </View>
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
    ...card.base,
    ...card.shadow,
  },
  strip: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    borderCurve: 'continuous',
  },
  label: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: ICON_SIZE + spacing.md * 2,
    paddingVertical: spacing.md,
  },
  value: {
    ...typography.title.title2,
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
