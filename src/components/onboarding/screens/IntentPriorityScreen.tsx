import { Text } from '../../common/Text';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import { INTENT_OPTIONS } from '../data/intentOptions';
import { INTENT_ICONS } from '../data/intentOptionIcons';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingOptionIcon from '../OnboardingOptionIcon';
import type { OnboardingIntent } from '../types';

interface IntentPriorityScreenProps {
  selectedIntents: OnboardingIntent[];
  primaryIntent: OnboardingIntent | null;
  isSubmitting: boolean;
  stepIndex: number;
  stepCount: number;
  onSelect: (intentId: OnboardingIntent) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function IntentPriorityScreen({
  selectedIntents,
  primaryIntent,
  isSubmitting,
  stepIndex,
  stepCount,
  onSelect,
  onContinue,
  onBack,
}: IntentPriorityScreenProps) {
  const options = INTENT_OPTIONS.filter((option) =>
    selectedIntents.includes(option.id),
  );
  const canContinue =
    primaryIntent != null &&
    selectedIntents.includes(primaryIntent) &&
    !isSubmitting;

  const handleSelect = (intentId: OnboardingIntent) => {
    if (isHapticsEnabled()) Haptics.selectionAsync().catch(() => {});
    onSelect(intentId);
  };

  return (
    <OnboardingScreenLayout
      title="What is most important to you?"
      subtitle="Choose the one you want Azora to focus on first."
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={
        <OnboardingPrimaryButton
          label="Continue"
          onPress={onContinue}
          disabled={!canContinue}
          loading={isSubmitting}
        />
      }
    >
      <View style={styles.options} accessibilityRole="radiogroup">
        {options.map((option, index) => {
          const selected = primaryIntent === option.id;

          return (
            <Pressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled: isSubmitting }}
              disabled={isSubmitting}
              onPress={() => handleSelect(option.id)}
              style={({ pressed }) => [
                styles.option,
                index !== 0 && styles.optionDivider,
                pressed && styles.optionPressed,
                isSubmitting && !selected && styles.optionDisabled,
              ]}
            >
              <OnboardingOptionIcon
                name={INTENT_ICONS[option.id]}
                selected={selected}
              />
              <Text
                style={[
                  styles.optionTitle,
                  selected && styles.optionTitleSelected,
                ]}
                numberOfLines={1}
              >
                {option.title}
              </Text>
              <View
                style={[
                  styles.radio,
                  selected && { borderColor: colors.primary.blue600 },
                ]}
              >
                {selected ? (
                  <View
                    style={[
                      styles.radioInner,
                      { backgroundColor: colors.primary.blue600 },
                    ]}
                  />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  options: {
    marginTop: 0,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  optionDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
  },
  optionPressed: {
    opacity: 0.6,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionTitle: {
    ...typography.body.medium,
    color: colors.text.primary,
    flex: 1,
  },
  optionTitleSelected: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
});
