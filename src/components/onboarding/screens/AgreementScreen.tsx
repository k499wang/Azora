import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

export type AgreementValue = 'disagree' | 'neutral' | 'agree';

export const AGREEMENT_STATEMENTS: { id: string; text: string }[] = [
  { id: 'exhausted', text: 'I often feel mentally exhausted.' },
  { id: 'racing', text: 'I struggle to slow my mind down.' },
  { id: 'reactive', text: 'Small things stress me out more than they should.' },
];

const OPTIONS: { value: AgreementValue; label: string }[] = [
  { value: 'disagree', label: 'Disagree' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'agree', label: 'Agree' },
];

interface AgreementScreenProps {
  responses: Record<string, AgreementValue | null>;
  stepIndex: number;
  stepCount: number;
  onChange: (id: string, value: AgreementValue) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function AgreementScreen({
  responses,
  stepIndex,
  stepCount,
  onChange,
  onContinue,
  onBack,
}: AgreementScreenProps) {
  const allAnswered = AGREEMENT_STATEMENTS.every((s) => responses[s.id] != null);

  const handleSelect = (id: string, value: AgreementValue) => {
    if (isHapticsEnabled()) Haptics.selectionAsync().catch(() => {});
    onChange(id, value);
  };

  return (
    <OnboardingScreenLayout
      title="Does any of this sound like you?"
      subtitle="Tap how much each statement fits."
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={
        <OnboardingPrimaryButton
          label="Continue"
          onPress={onContinue}
          disabled={!allAnswered}
        />
      }
    >
      <View style={styles.list}>
        {AGREEMENT_STATEMENTS.map((statement, index) => (
          <View
            key={statement.id}
            style={[styles.row, index !== 0 && styles.rowDivider]}
          >
            <Text style={styles.statement}>{statement.text}</Text>
            <View style={styles.options}>
              {OPTIONS.map((option) => {
                const selected = responses[statement.id] === option.value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => handleSelect(statement.id, option.value)}
                    style={({ pressed }) => [
                      styles.chip,
                      selected && styles.chipSelected,
                      pressed && !selected && styles.chipPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipLabel,
                        selected && styles.chipLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: spacing.xs,
  },
  row: {
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
  },
  statement: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
    lineHeight: 22,
  },
  options: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: colors.primary.blue600,
    borderColor: colors.primary.blue600,
  },
  chipPressed: {
    opacity: 0.6,
  },
  chipLabel: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  chipLabelSelected: {
    color: colors.text.inverse,
  },
});
