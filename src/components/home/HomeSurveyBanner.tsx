import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import Icon from '../common/icons/Icon';
import { Text } from '../common/Text';

const SURVEY_COPY = 'Take a survey and get 50% off';

interface HomeSurveyBannerProps {
  onPress?: () => void;
}

export default function HomeSurveyBanner({ onPress }: HomeSurveyBannerProps) {
  const content = (
    <>
      <Icon name="message" size={24} color={colors.text.inverse} />
      <Text style={styles.label}>{SURVEY_COPY}</Text>
      <Icon name="chevron-right" size={24} color="rgba(255,255,255,0.78)" />
    </>
  );

  if (onPress == null) {
    return <View style={styles.banner}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={SURVEY_COPY}
      onPress={onPress}
      style={({ pressed }) => [styles.banner, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 22,
    backgroundColor: 'rgba(12,16,33,0.35)',
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
