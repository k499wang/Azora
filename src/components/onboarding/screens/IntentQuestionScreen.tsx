import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Icon from '../../common/icons/Icon';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import { INTENT_OPTIONS } from '../data/intentOptions';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

interface IntentQuestionScreenProps {
  selectedIntent: string | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  stepIndex: number;
  stepCount: number;
  onSelect: (intentId: string) => void;
  onContinue: () => void;
}

export default function IntentQuestionScreen({
  selectedIntent,
  isSubmitting,
  errorMessage,
  stepIndex,
  stepCount,
  onSelect,
  onContinue,
}: IntentQuestionScreenProps) {
  const canContinue = selectedIntent != null && !isSubmitting;

  const handleSelect = (intentId: string) => {
    if (isHapticsEnabled()) Haptics.selectionAsync().catch(() => {});
    onSelect(intentId);
  };

  return (
    <OnboardingScreenLayout
      title="What's on your mind?"
      subtitle="Pick what feels closest right now — Azora will tune to it."
      progress={stepIndex / stepCount}
      footer={
        <OnboardingPrimaryButton
          label="Continue"
          onPress={onContinue}
          disabled={!canContinue}
          loading={isSubmitting}
        />
      }
    >
      <View style={styles.timeHint}>
        <MaterialCommunityIcons
          name="clock-outline"
          size={14}
          color={colors.text.tertiary}
        />
        <Text style={styles.timeHintText}>Takes about 2 minutes</Text>
      </View>

      <View style={styles.options}>
        {INTENT_OPTIONS.map((option, index) => {
          const selected = selectedIntent === option.id;
          const isFirst = index === 0;

          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled: isSubmitting }}
              disabled={isSubmitting}
              onPress={() => handleSelect(option.id)}
              style={({ pressed }) => [
                styles.option,
                !isFirst && styles.optionDivider,
                pressed && styles.optionPressed,
                isSubmitting && !selected && styles.optionDisabled,
              ]}
            >
              <Icon
                name={option.icon}
                size={22}
                color={selected ? option.accent : colors.text.tertiary}
              />
              <Text
                style={[styles.optionTitle, selected && styles.optionTitleSelected]}
                numberOfLines={1}
              >
                {option.title}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  timeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  timeHintText: {
    ...typography.body.small,
    fontSize: 12,
    color: colors.text.tertiary,
  },
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
    fontWeight: '600',
    color: colors.text.primary,
  },
  error: {
    ...typography.body.small,
    color: colors.error[700],
    marginTop: spacing.sm,
  },
});
