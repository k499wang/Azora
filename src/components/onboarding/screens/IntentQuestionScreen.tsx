import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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
  customIntent: string;
  isSubmitting: boolean;
  errorMessage: string | null;
  stepIndex: number;
  stepCount: number;
  onSelect: (intentId: string | null) => void;
  onCustomIntentChange: (value: string) => void;
  onContinue: () => void;
}

export default function IntentQuestionScreen({
  selectedIntent,
  customIntent,
  isSubmitting,
  errorMessage,
  stepIndex,
  stepCount,
  onSelect,
  onCustomIntentChange,
  onContinue,
}: IntentQuestionScreenProps) {
  const needsCustomIntent = selectedIntent === 'other';
  const canContinue =
    selectedIntent != null &&
    !isSubmitting &&
    (!needsCustomIntent || customIntent.trim().length > 0);

  const handleSelect = (intentId: string) => {
    if (isHapticsEnabled()) Haptics.selectionAsync().catch(() => {});
    onSelect(intentId);
  };

  return (
    <OnboardingScreenLayout
      title="What's on your mind?"
      subtitle="Pick what feels closest right now — Azora will tune to it."
      progress={stepIndex / stepCount}
      keyboardAvoiding={needsCustomIntent}
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

      {needsCustomIntent ? (
        <View style={styles.customIntentBlock}>
          <Text style={styles.customIntentLabel}>Tell us more</Text>
          <TextInput
            accessibilityLabel="Tell us more"
            autoCapitalize="sentences"
            autoCorrect
            editable={!isSubmitting}
            multiline
            onChangeText={onCustomIntentChange}
            placeholder="Example: I want a short breathing reset before meetings."
            placeholderTextColor={colors.text.tertiary}
            returnKeyType="done"
            style={styles.input}
            textAlignVertical="top"
            value={customIntent}
          />
        </View>
      ) : null}

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  timeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: -spacing.lg,
    marginBottom: spacing.xs,
  },
  timeHintText: {
    ...typography.body.small,
    fontSize: 12,
    color: colors.text.tertiary,
  },
  options: {
    marginTop: 0,
  },
  customIntentBlock: {
    gap: spacing.sm,
  },
  customIntentLabel: {
    ...typography.body.small,
    color: colors.text.secondary,
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
  input: {
    minHeight: 156,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 20,
    backgroundColor: colors.background.elevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.input.text,
    color: colors.text.primary,
  },
  error: {
    ...typography.body.small,
    color: colors.error[700],
    marginTop: spacing.sm,
  },
});
