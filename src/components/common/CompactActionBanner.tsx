import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import Icon, { type IconName } from './icons/Icon';
import { Text } from './Text';

interface CompactActionBannerProps {
  label: string;
  icon: IconName;
  onPress?: () => void;
  accessibilityLabel?: string;
}

export default function CompactActionBanner({
  label,
  icon,
  onPress,
  accessibilityLabel = label,
}: CompactActionBannerProps) {
  const content = (
    <>
      <Icon name={icon} size={24} color={colors.text.inverse} />
      <Text style={styles.label}>{label}</Text>
      <Icon name="chevron-right" size={24} color="rgba(255,255,255,0.78)" />
    </>
  );

  if (onPress == null) {
    return <View style={styles.banner}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.banner, pressed && styles.pressed]}
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
    borderRadius: 22,
    backgroundColor: 'rgba(12,16,33,0.26)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.20)',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  label: {
    ...typography.body.medium,
    flex: 1,
    fontFamily: fonts.regular,
    fontWeight: '400',
    fontSize: 17,
    lineHeight: 25,
    color: colors.text.inverse,
  },
});
