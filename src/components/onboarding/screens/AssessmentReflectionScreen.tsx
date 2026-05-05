import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Icon, { type IconName } from '../../common/icons/Icon';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import type { AgreementValue } from './AgreementScreen';
import type { ExperienceLevel } from './ExperienceScreen';

interface AssessmentReflectionScreenProps {
  name: string;
  stressLevel: number;
  sleepQuality: number;
  agreementResponses: Record<string, AgreementValue | null>;
  experienceLevel: ExperienceLevel | null;
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

interface Insight {
  icon: IconName;
  accent: string;
  headline: string;
  body: string;
}

function buildInsights(
  stress: number,
  sleep: number,
  agreementResponses: Record<string, AgreementValue | null>,
  experience: ExperienceLevel | null,
): Insight[] {
  const insights: Insight[] = [];

  if (stress >= 7) {
    insights.push({
      icon: 'breath-timer',
      accent: colors.warning[500],
      headline: 'Your stress is running hot',
      body: `You're at ${stress}/10 — Azora's plan starts with quick down-regulation breathwork.`,
    });
  } else if (stress >= 4) {
    insights.push({
      icon: 'waves',
      accent: colors.primary.blue600,
      headline: 'Mid-range tension',
      body: `${stress}/10 stress is the most common starting point — small daily resets compound fast.`,
    });
  } else {
    insights.push({
      icon: 'sparkle',
      accent: colors.success[500],
      headline: "You're starting from a calm base",
      body: `${stress}/10 stress — we'll focus on focus, performance, and keeping you steady.`,
    });
  }

  if (sleep <= 4) {
    insights.push({
      icon: 'moon',
      accent: colors.primary.blue700,
      headline: 'Sleep is the lever to pull',
      body: `${sleep}/10 rested — slow exhale breathing before bed can shift this within 2 weeks.`,
    });
  } else if (sleep <= 7) {
    insights.push({
      icon: 'moon',
      accent: colors.primary.blue600,
      headline: 'Sleep has room to grow',
      body: `${sleep}/10 — wind-down breathing will give you deeper, more recoverable nights.`,
    });
  } else {
    insights.push({
      icon: 'sun',
      accent: colors.orange[500],
      headline: 'Your sleep is solid',
      body: `${sleep}/10 — we'll protect that and build calm and focus during the day.`,
    });
  }

  const agreeCount = Object.values(agreementResponses).filter(
    (v) => v === 'agree',
  ).length;
  if (agreeCount >= 2) {
    insights.push({
      icon: 'heart',
      accent: colors.error[500],
      headline: "You're not alone in this",
      body: '78% of new users agree with at least two of those statements. The right practice changes it.',
    });
  } else if (agreeCount === 1) {
    insights.push({
      icon: 'heart',
      accent: colors.primary.blue600,
      headline: 'You know what you want to shift',
      body: 'Naming the pattern is half the work. Daily practice does the rest.',
    });
  }

  if (experience === 'never') {
    insights.push({
      icon: 'streak',
      accent: colors.success[500],
      headline: "We'll start gentle",
      body: "Since you're new, your first week is short, guided, and forgiving.",
    });
  } else if (experience === 'regular') {
    insights.push({
      icon: 'streak',
      accent: colors.success[500],
      headline: "You'll feel right at home",
      body: "We'll skip the basics and tune Azora to push your practice further.",
    });
  }

  return insights.slice(0, 4);
}

export default function AssessmentReflectionScreen({
  name,
  stressLevel,
  sleepQuality,
  agreementResponses,
  experienceLevel,
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: AssessmentReflectionScreenProps) {
  const insights = useMemo(
    () =>
      buildInsights(stressLevel, sleepQuality, agreementResponses, experienceLevel),
    [stressLevel, sleepQuality, agreementResponses, experienceLevel],
  );
  const anims = useRef(insights.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (isHapticsEnabled()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    }
    Animated.stagger(
      140,
      anims.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 460,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [anims]);

  const trimmedName = name.trim();
  const title = trimmedName
    ? `Here's what we're hearing, ${trimmedName}.`
    : "Here's what we're hearing.";

  return (
    <OnboardingScreenLayout
      title={title}
      subtitle="Based on your answers, this is where Azora will start with you."
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={
        <OnboardingPrimaryButton label="Sounds about right" onPress={onContinue} />
      }
    >
      <View style={styles.list}>
        {insights.map((insight, index) => (
          <Animated.View
            key={`${insight.headline}-${index}`}
            style={[
              styles.row,
              index !== 0 && styles.rowDivider,
              {
                opacity: anims[index],
                transform: [
                  {
                    translateY: anims[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${insight.accent}14` }]}>
              <Icon name={insight.icon} size={22} color={insight.accent} />
            </View>
            <View style={styles.text}>
              <Text style={styles.headline}>{insight.headline}</Text>
              <Text style={styles.body}>{insight.body}</Text>
            </View>
          </Animated.View>
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  text: {
    flex: 1,
    gap: spacing.xs,
  },
  headline: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 15,
    lineHeight: 20,
    color: colors.text.primary,
  },
  body: {
    ...typography.body.small,
    fontSize: 13,
    lineHeight: 19,
    color: colors.text.secondary,
  },
});
