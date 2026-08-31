import { Text } from '../../common/Text';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { card } from '../../../theme/card';
import { buildAssessmentSynthesis } from '../../../lib/onboardingAssessmentReflection';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import type { PersonalizedIntentOption } from '../types';
import type { AgreementValue } from './AgreementScreen';

interface AssessmentReflectionScreenProps {
  name: string;
  stressLevel: number | null;
  sleepQuality: number | null;
  heartWorryLevel: number | null;
  agreementResponses: Record<string, AgreementValue | null>;
  intentOption: PersonalizedIntentOption | null;
  goalPhrases: readonly string[];
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

export default function AssessmentReflectionScreen({
  name,
  stressLevel,
  sleepQuality,
  heartWorryLevel,
  agreementResponses,
  intentOption,
  goalPhrases,
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: AssessmentReflectionScreenProps) {
  const synthesis = useMemo(
    () =>
      buildAssessmentSynthesis({
        stress: stressLevel,
        sleep: sleepQuality,
        heartWorry: heartWorryLevel,
        agreementResponses,
        primaryPlan: intentOption?.assessmentPlan ?? null,
        goalPhrases,
      }),
    [
      stressLevel,
      sleepQuality,
      heartWorryLevel,
      agreementResponses,
      intentOption,
      goalPhrases,
    ],
  );

  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    if (isHapticsEnabled()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    }
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(lift, {
        toValue: 0,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, lift]);

  const trimmedName = name.trim();
  const title = `Here’s what we heard${trimmedName ? `, ${trimmedName}` : ''}.`;

  return (
    <OnboardingScreenLayout
      title={title}
      subtitle="Your answers give us a clear place to start."
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={
        <OnboardingPrimaryButton label="Sounds about right" onPress={onContinue} />
      }
    >
      <Animated.View
        style={[
          styles.quoteCard,
          card.base,
          { opacity: fade, transform: [{ translateY: lift }] },
        ]}
      >
        <Text style={styles.quoteMark}>“</Text>
        <Text style={styles.quote}>{synthesis}</Text>
        <Text style={styles.signature}>Azora</Text>
      </Animated.View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  quoteCard: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  quoteMark: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 56,
    lineHeight: 56,
    color: colors.primary.blue600,
    marginBottom: -spacing.sm,
  },
  quote: {
    ...typography.body.large,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 17,
    lineHeight: 26,
    color: colors.text.primary,
  },
  signature: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.tertiary,
    marginTop: spacing.md,
  },
});
