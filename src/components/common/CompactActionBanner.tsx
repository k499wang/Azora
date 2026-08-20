import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { pressable } from '../../theme/pressable';
import { card, radius } from '../../theme/card';
import { spacing } from '../../theme/spacing';
import { typography, fonts } from '../../theme/typography';
import { triggerTapHaptic } from '../../native/tapHaptics';
import Icon, { type IconName } from './icons/Icon';
import { Text } from './Text';

interface CompactActionBannerProps {
  label: string;
  icon: IconName;
  onPress?: () => void;
  accessibilityLabel?: string;
  /** `photo` (default) floats over photography; `card` reads as a white CTA card. */
  tone?: 'photo' | 'card';
}

export default function CompactActionBanner({
  label,
  icon,
  onPress,
  accessibilityLabel = label,
  tone = 'photo',
}: CompactActionBannerProps) {
  const isCard = tone === 'card';
  const content = (
    <>
      <Icon
        name={icon}
        size={24}
        color={isCard ? colors.text.primary : colors.text.inverse}
      />
      <Text style={[styles.label, isCard && styles.labelCard]}>{label}</Text>
      <Icon
        name="chevron-right"
        size={24}
        color={isCard ? colors.text.secondary : colors.photoBanner.chevron}
      />
    </>
  );

  const bannerStyle = [styles.banner, isCard && styles.bannerCard];

  if (onPress == null) {
    return <View style={bannerStyle}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={() => {
        triggerTapHaptic();
        onPress();
      }}
      style={({ pressed }) => [
        styles.banner,
        isCard && styles.bannerCard,
        pressed && styles.pressed,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.large,
    borderCurve: 'continuous',
    backgroundColor: colors.photoBanner.fill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.photoBanner.edge,
  },
  bannerCard: {
    backgroundColor: colors.background.card,
    borderColor: colors.border.default,
    ...card.shadow,
  },
  pressed: pressable.subtle,
  label: {
    ...typography.body.medium,
    flex: 1,
    color: colors.text.inverse,
  },
  labelCard: {
    ...typography.label.large,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
});
