import { Text } from '../../common/Text';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
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
  selectedIntents: string[];
  isSubmitting: boolean;
  errorMessage: string | null;
  stepIndex: number;
  stepCount: number;
  onToggle: (intentId: string) => void;
  onContinue: () => void;
}

export default function IntentQuestionScreen({
  selectedIntents,
  isSubmitting,
  errorMessage,
  stepIndex,
  stepCount,
  onToggle,
  onContinue,
}: IntentQuestionScreenProps) {
  const rowAnims = useRef(
    INTENT_OPTIONS.map(() => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    const animation = Animated.stagger(
      45,
      rowAnims.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 420,
          delay: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ),
    );
    animation.start();
    return () => animation.stop();
  }, [rowAnims]);

  const canContinue = selectedIntents.length > 0 && !isSubmitting;

  const handleToggle = (intentId: string) => {
    if (isHapticsEnabled()) Haptics.selectionAsync().catch(() => {});
    onToggle(intentId);
  };

  return (
    <OnboardingScreenLayout
      title="What's on your mind?"
      subtitle="Pick as many as feel right — Azora will tune to them."
      progress={stepIndex / stepCount}
      fullWidthProgress
      animateCopy
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
        <Text style={styles.timeHintText}>Takes about 5 minutes</Text>
      </View>

      <View style={styles.options}>
        {INTENT_OPTIONS.map((option, index) => {
          const selected = selectedIntents.includes(option.id);
          const isFirst = index === 0;

          const anim = rowAnims[index];

          return (
            <Animated.View
              key={option.id}
              style={{
                opacity: anim,
                transform: [
                  {
                    translateY: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [14, 0],
                    }),
                  },
                ],
              }}
            >
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected, disabled: isSubmitting }}
                disabled={isSubmitting}
                onPress={() => handleToggle(option.id)}
                style={({ pressed }) => [
                  styles.option,
                  !isFirst && styles.optionDivider,
                  pressed && styles.optionPressed,
                  isSubmitting && !selected && styles.optionDisabled,
                ]}
              >
                <Icon
                  name={option.icon}
                  size={20}
                  color={selected ? colors.primary.blue600 : colors.text.tertiary}
                />
                <Text
                  style={[styles.optionTitle, selected && styles.optionTitleSelected]}
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
                      style={[styles.radioInner, { backgroundColor: colors.primary.blue600 }]}
                    />
                  ) : null}
                </View>
              </Pressable>
            </Animated.View>
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
  error: {
    ...typography.body.small,
    color: colors.error[700],
    marginTop: spacing.sm,
  },
});
