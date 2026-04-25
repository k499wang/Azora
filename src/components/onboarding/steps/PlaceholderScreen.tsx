import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { OnboardingStepProps } from '../types';
import { colors } from '../../../theme/colors';
import { spacing, padding } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';

export function PlaceholderScreen({ onNext, stepIndex, totalSteps }: OnboardingStepProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.lg }]}>
      <View style={styles.content}>
        <Text style={styles.label}>Step {stepIndex + 1} of {totalSteps}</Text>
        <Text style={styles.title}>Onboarding Screen</Text>
        <Text style={styles.subtitle}>Replace this with real content.</Text>
      </View>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={onNext}
      >
        <Text style={styles.buttonText}>{stepIndex < totalSteps - 1 ? 'Next' : 'Get Started'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    paddingHorizontal: padding.screen.horizontal,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.sm,
  },
  label: {
    ...typography.label.medium,
    color: colors.text.tertiary,
  },
  title: {
    ...typography.title.title1,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body.large,
    color: colors.text.secondary,
  },
  button: {
    backgroundColor: colors.primary.blue600,
    borderRadius: 16,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    ...typography.button.large,
    color: colors.text.inverse,
  },
});
