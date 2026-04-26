import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { OnboardingStepProps } from '../types';
import Icon, { type IconName } from '../../common/icons/Icon';
import { colors } from '../../../theme/colors';
import { spacing, padding } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import { card } from '../../../theme/card';

export type Intent =
  | 'stress'
  | 'sleep'
  | 'anxiety'
  | 'focus'
  | 'athletic'
  | 'heart_health';

interface IntentOption {
  id: Intent;
  label: string;
  hint: string;
  icon: IconName;
}

const OPTIONS: IntentOption[] = [
  { id: 'stress', label: 'Lower my stress', hint: 'Wind down a busy mind', icon: 'breath-wave' },
  { id: 'sleep', label: 'Sleep better', hint: 'Fall asleep faster, deeper', icon: 'breath-moon' },
  { id: 'anxiety', label: 'Calm anxiety', hint: 'Take the edge off', icon: 'breath-leaf' },
  { id: 'focus', label: 'Sharpen focus', hint: 'Get into flow', icon: 'breath-lightning' },
  { id: 'athletic', label: 'Athletic performance', hint: 'Recover and breathe stronger', icon: 'breath-box' },
  { id: 'heart_health', label: 'Heart & wellness', hint: 'Train HRV and resilience', icon: 'heart-glow' },
];

interface IntentScreenProps extends OnboardingStepProps {
  selected: Intent[];
  onChange: (next: Intent[]) => void;
}

export function IntentScreen({ onNext, selected, onChange }: IntentScreenProps) {
  const insets = useSafeAreaInsets();
  const [local, setLocal] = useState<Intent[]>(selected);

  const toggle = (id: Intent) => {
    setLocal((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      onChange(next);
      return next;
    });
  };

  const canContinue = local.length > 0;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg },
      ]}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Personalize your plan</Text>
        <Text style={styles.title}>What brings you here?</Text>
        <Text style={styles.subtitle}>Pick anything that fits — we'll tailor your sessions.</Text>

        <View style={styles.grid}>
          {OPTIONS.map((opt) => {
            const isOn = local.includes(opt.id);
            const tint = isOn ? colors.primary.blue600 : colors.text.secondary;
            return (
              <Pressable
                key={opt.id}
                onPress={() => toggle(opt.id)}
                style={({ pressed }) => [
                  card.base,
                  card.shadow,
                  styles.option,
                  isOn && styles.optionActive,
                  pressed && styles.optionPressed,
                ]}
              >
                <View style={[styles.iconBubble, isOn && styles.iconBubbleActive]}>
                  <Icon name={opt.icon} size={24} color={tint} />
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, isOn && styles.optionLabelActive]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.optionHint}>{opt.hint}</Text>
                </View>
                <View style={[styles.check, isOn && styles.checkActive]}>
                  {isOn && <View style={styles.checkDot} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Pressable
        disabled={!canContinue}
        style={({ pressed }) => [
          styles.button,
          !canContinue && styles.buttonDisabled,
          pressed && canContinue && styles.buttonPressed,
        ]}
        onPress={onNext}
      >
        <Text style={styles.buttonText}>
          {canContinue ? `Continue · ${local.length} selected` : 'Pick at least one'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    paddingHorizontal: padding.screen.horizontal,
  },
  scroll: {
    paddingBottom: spacing.lg,
  },
  eyebrow: {
    ...typography.overline,
    color: colors.text.brand,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.title.title1,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body.medium,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  grid: {
    gap: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  optionActive: {
    borderColor: colors.primary.blue500,
    backgroundColor: colors.background.accentSoft,
  },
  optionPressed: {
    opacity: 0.85,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
  },
  iconBubbleActive: {
    backgroundColor: colors.primary.blue100,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    ...typography.heading.heading2,
    color: colors.text.primary,
  },
  optionLabelActive: {
    color: colors.text.brand,
  },
  optionHint: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkActive: {
    borderColor: colors.primary.blue600,
    backgroundColor: colors.primary.blue600,
  },
  checkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.text.inverse,
  },
  button: {
    backgroundColor: colors.primary.blue600,
    borderRadius: 16,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.neutral[300],
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    ...typography.button.large,
    color: colors.text.inverse,
  },
});
