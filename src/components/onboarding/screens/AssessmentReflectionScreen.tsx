import { Text } from '../../common/Text';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { card } from '../../../theme/card';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import type { AgreementValue } from './AgreementScreen';
import type { ExperienceLevel } from './ExperienceScreen';

interface AssessmentReflectionScreenProps {
  name: string;
  stressLevel: number | null;
  sleepQuality: number | null;
  agreementResponses: Record<string, AgreementValue | null>;
  experienceLevel: ExperienceLevel | null;
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

function buildSynthesis(
  stress: number | null,
  sleep: number | null,
  experience: ExperienceLevel | null,
): string {
  if (stress == null && sleep == null) {
    return experience === 'regular'
      ? 'We’ll build from the experience you already have and keep your plan focused.'
      : 'We’ll start with short, guided resets and adapt the plan as Azora learns what helps.';
  }

  if (stress == null) {
    return sleep != null && sleep <= 4
      ? 'Light sleep is the clearest signal you shared. We’ll start with evening wind-down work.'
      : 'Your sleep gives us a useful starting point. We’ll begin with a balanced daily reset.';
  }

  if (sleep == null) {
    return stress >= 7
      ? 'Stress is the clearest signal you shared. We’ll start with quick down-regulation breathwork.'
      : 'Your stress level gives us a useful starting point. We’ll begin with short daily resets.';
  }

  const stressHigh = stress >= 7;
  const stressMid = stress >= 4 && stress < 7;
  const sleepLow = sleep <= 4;
  const sleepMid = sleep > 4 && sleep <= 7;

  let opener: string;
  if (stressHigh && sleepLow) {
    opener =
      'Your stress is running hot and your sleep is light — the two feed each other.';
  } else if (stressHigh && sleepMid) {
    opener =
      'Stress is the loudest signal right now, and it’s starting to show up in your sleep.';
  } else if (stressHigh) {
    opener =
      'Stress is running hot, but you’re still sleeping well — a good base to work from.';
  } else if (stressMid && sleepLow) {
    opener =
      'Stress is manageable, but light sleep is making it harder to recover between days.';
  } else if (stressMid) {
    opener =
      'You’re carrying the kind of low-grade tension small daily resets are built for.';
  } else if (sleepLow) {
    opener =
      'You’re calm during the day, but sleep is the lever that’s holding you back.';
  } else {
    opener =
      'You’re starting from a steady base — we’ll protect that and sharpen focus from here.';
  }

  let plan: string;
  if (sleepLow || (stressHigh && sleepMid)) {
    plan = 'We’ll start with evening wind-down work.';
  } else if (stressHigh) {
    plan = 'We’ll start with quick down-regulation breathwork.';
  } else if (stressMid) {
    plan = 'We’ll start with short daily resets you can do anywhere.';
  } else {
    plan = 'We’ll start with focus and performance sessions.';
  }

  let experienceLine = '';
  if (experience === 'never') {
    experienceLine = ' Since this is new, your first week is short and guided.';
  } else if (experience === 'regular') {
    experienceLine = ' Since you’ve practiced before, we’ll skip the basics.';
  }

  return `${opener} ${plan}${experienceLine}`;
}

export default function AssessmentReflectionScreen({
  name,
  stressLevel,
  sleepQuality,
  agreementResponses: _agreementResponses,
  experienceLevel,
  stepIndex,
  stepCount,
  onContinue,
  onBack,
  onSkip,
}: AssessmentReflectionScreenProps) {
  const synthesis = useMemo(
    () => buildSynthesis(stressLevel, sleepQuality, experienceLevel),
    [stressLevel, sleepQuality, experienceLevel],
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
  const title = trimmedName
    ? `Here's what we're hearing, ${trimmedName}.`
    : "Here's what we're hearing.";

  return (
    <OnboardingScreenLayout
      title={title}
      subtitle="Based on your answers, here's what Azora knows."
      progress={stepIndex / stepCount}
      onBack={onBack}
      onSkip={onSkip}
      footer={
        <OnboardingPrimaryButton label="Sounds about right" onPress={onContinue} />
      }
    >
      <Animated.View
        style={[
          styles.quoteCard,
          card.base,
          card.shadow,
          { opacity: fade, transform: [{ translateY: lift }] },
        ]}
      >
        <Text style={styles.quoteMark}>“</Text>
        <Text style={styles.quote}>{synthesis}</Text>
        <Text style={styles.signature}>— Azora</Text>
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
