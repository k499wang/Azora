import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../../common/icons/Icon';
import { card } from '../../../theme/card';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { INTENT_OPTIONS } from '../data/intentOptions';

interface IntentQuestionScreenProps {
  selectedIntent: string | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  onSelect: (intentId: string) => void;
  onContinue: () => void;
}

export default function IntentQuestionScreen({
  selectedIntent,
  isSubmitting,
  errorMessage,
  onSelect,
  onContinue,
}: IntentQuestionScreenProps) {
  const canContinue = selectedIntent != null && !isSubmitting;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>Personalize Azora</Text>
          <Text style={styles.title}>What brings you here?</Text>
          <Text style={styles.subtitle}>
            Choose the goal that feels closest right now.
          </Text>
        </View>

        <View style={styles.options}>
          {INTENT_OPTIONS.map((option) => {
            const selected = selectedIntent === option.id;

            return (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled: isSubmitting }}
                disabled={isSubmitting}
                onPress={() => onSelect(option.id)}
                style={({ pressed }) => [
                  styles.option,
                  selected && styles.optionSelected,
                  pressed && styles.optionPressed,
                  isSubmitting && !selected && styles.optionDisabled,
                ]}
              >
                <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
                  <Icon
                    name={option.icon}
                    size={24}
                    color={selected ? colors.text.inverse : colors.primary.blue600}
                  />
                </View>

                <View style={styles.optionCopy}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionBody}>{option.body}</Text>
                </View>

                {selected ? (
                  <ActivityIndicator color={colors.primary.blue600} />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canContinue }}
          disabled={!canContinue}
          onPress={onContinue}
          style={({ pressed }) => [
            styles.continueButton,
            pressed && styles.continueButtonPressed,
            !canContinue && styles.continueButtonDisabled,
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.text.inverse} />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing['3xl'],
    gap: spacing.xl,
  },
  copy: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  eyebrow: {
    ...typography.label.medium,
    color: colors.text.brand,
    textAlign: 'center',
  },
  title: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 320,
  },
  options: {
    gap: spacing.md,
  },
  option: {
    ...card.base,
    ...card.shadow,
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  optionSelected: {
    borderColor: colors.border.brand,
    backgroundColor: colors.background.accentSoft,
  },
  optionPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
  optionDisabled: {
    opacity: 0.6,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary.blue100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSelected: {
    backgroundColor: colors.primary.blue600,
  },
  optionCopy: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    ...typography.heading.heading2,
    color: colors.text.primary,
  },
  optionBody: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  error: {
    ...typography.body.small,
    color: colors.error[700],
    textAlign: 'center',
  },
  continueButton: {
    minHeight: 56,
    borderRadius: 999,
    backgroundColor: colors.primary.blue600,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  continueButtonPressed: {
    backgroundColor: colors.primary.blue700,
    transform: [{ scale: 0.985 }],
  },
  continueButtonDisabled: {
    opacity: 0.45,
  },
  continueButtonText: {
    ...typography.button.large,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.inverse,
  },
});
