import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import { GENDER_OPTIONS, type GenderOption } from '../data/genderOptions';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

interface GenderScreenProps {
  value: GenderOption['id'] | null;
  stepIndex: number;
  stepCount: number;
  onSelect: (id: GenderOption['id']) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

export default function GenderScreen({
  value,
  stepIndex,
  stepCount,
  onSelect,
  onContinue,
  onBack,
  onSkip,
}: GenderScreenProps) {
  const handleSelect = (id: GenderOption['id']) => {
    if (isHapticsEnabled()) Haptics.selectionAsync().catch(() => {});
    onSelect(id);
  };

  return (
    <OnboardingScreenLayout
      title="How do you identify?"
      subtitle="This helps Azora frame guidance more naturally."
      progress={stepIndex / stepCount}
      onBack={onBack}
      onSkip={onSkip}
      footer={
        <OnboardingPrimaryButton
          label="Continue"
          onPress={onContinue}
          disabled={value == null}
        />
      }
    >
      <View style={styles.options}>
        {GENDER_OPTIONS.map((option, index) => {
          const selected = value === option.id;
          const isFirst = index === 0;

          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => handleSelect(option.id)}
              style={({ pressed }) => [
                styles.option,
                !isFirst && styles.optionDivider,
                pressed && styles.optionPressed,
              ]}
            >
              <View
                style={[
                  styles.dot,
                  { backgroundColor: selected ? option.accent : colors.border.default },
                ]}
              />
              <Text
                style={[styles.optionTitle, selected && styles.optionTitleSelected]}
              >
                {option.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  options: {
    marginTop: spacing.xs,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.lg,
  },
  optionDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
  },
  optionPressed: {
    opacity: 0.6,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  optionTitle: {
    ...typography.body.medium,
    color: colors.text.primary,
    flex: 1,
  },
  optionTitleSelected: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
  },
});
