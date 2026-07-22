import { Text } from '../../common/Text';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import Icon from '../../common/icons/Icon';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import MindMapRadar from '../MindMapRadar';
import { computeMindMap } from '../../../lib/onboardingScores';
import type { AgreementValue } from './AgreementScreen';
import type { ExperienceLevel } from './ExperienceScreen';

interface RecommendationScreenProps {
  intentTitle: string;
  stressLevel: number;
  sleepQuality: number;
  racingLevel: number;
  agreementResponses: Record<string, AgreementValue | null>;
  experienceLevel: ExperienceLevel | null;
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

const PERSONALIZING_STEPS = [
  'Analyzing your heart-rate pattern',
  'Mapping your stress & sleep signals',
  'Matching technique to your goal',
  'Calibrating your session length',
];

const STEP_DURATION_MS = 2200;
const REVEAL_DELAY_MS = 700;

function fireImpact(style: Haptics.ImpactFeedbackStyle) {
  if (!isHapticsEnabled()) return;
  Haptics.impactAsync(style).catch(() => {});
}

// One continuous curve with no segment junctions => no velocity dips at all,
// the smoothest possible fill. An ease-in-out curve makes each bar start slow,
// build through the middle, then settle into the finish — still reads as real
// loading. A small per-bar duration jitter keeps the four bars from feeling
// identical.
function buildBarAnimation(
  anim: Animated.Value,
  totalMs: number,
): Animated.CompositeAnimation {
  const jitter = (base: number, amount: number) =>
    base + (Math.random() * 2 - 1) * amount;

  return Animated.timing(anim, {
    toValue: 1,
    duration: jitter(totalMs, totalMs * 0.12),
    easing: Easing.bezier(0.5, 0, 0.2, 1),
    useNativeDriver: true,
  });
}

export default function RecommendationScreen({
  intentTitle,
  stressLevel,
  sleepQuality,
  racingLevel,
  agreementResponses,
  experienceLevel,
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: RecommendationScreenProps) {
  const { width } = useWindowDimensions();
  const mindMap = useMemo(
    () =>
      computeMindMap({
        stressLevel,
        sleepQuality,
        racingLevel,
        agreementResponses,
        experienceLevel,
      }),
    [stressLevel, sleepQuality, racingLevel, agreementResponses, experienceLevel],
  );
  const [showingResult, setShowingResult] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(0);
  const barAnims = useRef(
    PERSONALIZING_STEPS.map(() => new Animated.Value(0)),
  ).current;
  const checkAnims = useRef(
    PERSONALIZING_STEPS.map(() => new Animated.Value(0)),
  ).current;
  const resultFade = useRef(new Animated.Value(0)).current;
  const resultSlide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    let cancelled = false;
    let revealTimer: ReturnType<typeof setTimeout>;

    const reveal = () => {
      setShowingResult(true);
      if (isHapticsEnabled()) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
          () => {},
        );
      }
      Animated.parallel([
        Animated.timing(resultFade, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(resultSlide, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    };

    // Fill each bar in sequence; mark complete exactly when its fill lands so
    // the checkmark never drifts from the animation.
    const runStep = (i: number) => {
      buildBarAnimation(barAnims[i], STEP_DURATION_MS).start(({ finished }) => {
        if (!finished || cancelled) return;
        // A single tap lands exactly when the bar fills and the checkmark pops.
        fireImpact(Haptics.ImpactFeedbackStyle.Medium);
        setCompletedSteps(i + 1);
        // Pop the checkmark in with a little overshoot the moment its bar lands.
        Animated.spring(checkAnims[i], {
          toValue: 1,
          damping: 9,
          stiffness: 190,
          mass: 0.6,
          useNativeDriver: true,
        }).start();
        if (i + 1 < barAnims.length) {
          runStep(i + 1);
        } else {
          revealTimer = setTimeout(reveal, REVEAL_DELAY_MS);
        }
      });
    };
    runStep(0);

    return () => {
      cancelled = true;
      barAnims.forEach((anim) => anim.stopAnimation());
      checkAnims.forEach((anim) => anim.stopAnimation());
      clearTimeout(revealTimer);
    };
  }, [barAnims, checkAnims, resultFade, resultSlide]);

  if (!showingResult) {
    return (
      <OnboardingScreenLayout
        title="Your Mindmap"
        subtitle="We're building your personalized mindmap and plan based on your responses."
        progress={stepIndex / stepCount}
        onBack={onBack}
        footer={<View />}
      >
        <View style={styles.loadingBody}>
          <View style={styles.stepsList}>
            {PERSONALIZING_STEPS.map((label, i) => {
              const done = completedSteps > i;
              const active = completedSteps === i;
              return (
                <View key={label} style={styles.stepRow}>
                  <View style={styles.stepHeader}>
                    <Text
                      style={[
                        styles.stepLabel,
                        (done || active) && styles.stepLabelActive,
                      ]}
                    >
                      {label}
                    </Text>
                    {done ? (
                      <Animated.View
                        style={[
                          styles.stepCheck,
                          { transform: [{ scale: checkAnims[i] }] },
                        ]}
                      >
                        <Icon name="check" size={12} color={colors.text.inverse} />
                      </Animated.View>
                    ) : (
                      <View style={styles.stepCheckPending} />
                    )}
                  </View>
                  <View style={styles.stepTrack}>
                    <Animated.View
                      style={[
                        styles.stepFill,
                        { transform: [{ scaleX: barAnims[i] }] },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </OnboardingScreenLayout>
    );
  }

  return (
    <OnboardingScreenLayout
      title="Your Mindmap"
      subtitle={`Tailored to ${intentTitle.toLowerCase()}, your age, and how your body responded.`}
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Sounds good" onPress={onContinue} />}
    >
      <Animated.View
        style={[
          styles.resultBody,
          { opacity: resultFade, transform: [{ translateY: resultSlide }] },
        ]}
      >
        <View style={styles.mindMapWrap}>
          <MindMapRadar scores={mindMap.scores} size={width} />
        </View>

        <Text style={styles.mindMapCaption}>
          This is your baseline across the five areas that matter most. As you
          practice, we'll show you exactly how to strengthen each one inside the
          app.
        </Text>
      </Animated.View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  // Loading state
  loadingBody: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: spacing.lg,
  },
  stepsList: {
    gap: spacing['3xl'],
  },
  stepRow: {
    gap: spacing.sm,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  stepLabel: {
    ...typography.body.medium,
    color: colors.text.tertiary,
    flex: 1,
  },
  stepLabelActive: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  stepCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary.blue600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCheckPending: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border.default,
  },
  stepTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.primary.blue100,
    overflow: 'hidden',
  },
  stepFill: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary.blue600,
    transformOrigin: 'left',
  },

  // Result state
  resultBody: {
    gap: 0,
    marginTop: -spacing.xl,
  },
  mindMapWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
    marginHorizontal: -spacing.lg,
  },
  mindMapCaption: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
