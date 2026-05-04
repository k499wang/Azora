import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Icon from '../../common/icons/Icon';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import type { PersonalizedIntentOption } from '../types';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

interface IntentReflectionScreenProps {
  option: PersonalizedIntentOption;
  stepIndex: number;
  stepCount: number;
  isSubmitting: boolean;
  onContinue: () => void;
  onBack: () => void;
}

export default function IntentReflectionScreen({
  option,
  stepIndex,
  stepCount,
  isSubmitting,
  onContinue,
  onBack,
}: IntentReflectionScreenProps) {
  useEffect(() => {
    if (isHapticsEnabled()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    }
  }, []);

  return (
    <OnboardingScreenLayout
      title={`Azora will help you ${option.title.toLowerCase()}.`}
      subtitle={option.reflectionBody}
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={
        <OnboardingPrimaryButton
          label="Sounds right"
          onPress={onContinue}
          loading={isSubmitting}
        />
      }
    >
      <View style={styles.values}>
        {option.valuePoints.map((point, index) => (
          <View
            key={`${point.icon}-${index}`}
            style={[styles.valueRow, index !== 0 && styles.valueRowDivider]}
          >
            <Icon name={point.icon} size={22} color={point.accent} />
            <Text style={styles.valueLabel}>{point.label}</Text>
          </View>
        ))}
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  values: {
    marginTop: spacing.xs,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.lg,
  },
  valueRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
  },
  valueLabel: {
    ...typography.body.medium,
    color: colors.text.primary,
    flex: 1,
  },
});
