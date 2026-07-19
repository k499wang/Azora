import { Text } from '../../../../components/common/Text';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../../theme/colors';
import { fonts, typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';

interface TextColors {
  primary: string;
  secondary: string;
  tertiary: string;
  accent: string;
}

export interface BreathHoldStep {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  value: string;
  label: string;
}

interface Props {
  title: string;
  description: string;
  steps: BreathHoldStep[];
  caption?: string;
  textColors?: TextColors;
}

export default function BreathHoldIntro({
  title,
  description,
  steps,
  caption,
  textColors,
}: Props) {
  return (
    <View style={styles.container}>
      {caption ? (
        <Text style={[styles.caption, textColors && { color: textColors.accent }]}>
          {caption}
        </Text>
      ) : null}

      <View style={styles.stepRow}>
        {steps.map((step, idx) => (
          <View key={`${step.label}-${idx}`} style={styles.step}>
            <MaterialCommunityIcons
              name={step.icon}
              size={16}
              color={textColors ? textColors.accent : colors.primary.blue700}
            />
            <Text style={[styles.stepValue, textColors && { color: textColors.primary }]}>
              {step.value}
            </Text>
            <Text style={[styles.stepLabel, textColors && { color: textColors.tertiary }]}>
              {step.label}
            </Text>
          </View>
        ))}
      </View>

      <Text style={[styles.name, textColors && { color: textColors.primary }]}>
        {title}
      </Text>
      <Text style={[styles.description, textColors && { color: textColors.secondary }]}>
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    gap: spacing.md,
    alignItems: 'center',
    transform: [{ translateY: -48 }],
  },
  caption: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    color: colors.primary.blue700,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  name: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  description: {
    ...typography.body.large,
    fontFamily: fonts.regular,
    fontWeight: '400',
    color: colors.text.secondary,
    textAlign: 'center',
    opacity: 0.8,
  },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  step: {
    alignItems: 'center',
    gap: 2,
  },
  stepValue: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  stepLabel: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
    letterSpacing: 0.5,
  },
});
