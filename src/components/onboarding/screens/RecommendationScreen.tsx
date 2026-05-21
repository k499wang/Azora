import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { card } from '../../../theme/card';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import { TECHNIQUE_RECOMMENDATIONS } from '../data/techniqueRecommendations';
import TECHNIQUES from '../../../data/techniques';
import type { BaselineResult } from './BaselineScreen';
import LineGraph, { type DataPoint } from '../../analytics/LineGraph';
import MindMapRadar from '../MindMapRadar';
import { computeMindMap } from '../../../lib/onboardingScores';
import type { AgreementValue } from './AgreementScreen';
import type { ExperienceLevel } from './ExperienceScreen';

interface RecommendationScreenProps {
  techniqueId: string;
  intentTitle: string;
  age: number;
  dailyMinutes: number;
  baseline: BaselineResult | null;
  stressLevel: number;
  sleepQuality: number;
  agreementResponses: Record<string, AgreementValue | null>;
  experienceLevel: ExperienceLevel | null;
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

function buildBpmSeries(history: number[], durationSec: number): DataPoint[] {
  if (history.length === 0) return [];
  const step = Math.max(1, Math.floor(history.length / 12));
  const points: DataPoint[] = [];
  for (let i = 0; i < history.length; i += step) {
    const value = history[i];
    const second = Math.round((i / history.length) * durationSec);
    points.push({ label: `${second}s`, value });
  }
  // Always include the last point
  if (points.length === 0 || points[points.length - 1].value !== history[history.length - 1]) {
    points.push({ label: `${durationSec}s`, value: history[history.length - 1] });
  }
  return points;
}

const PERSONALIZING_STEPS = [
  'Analyzing your heart-rate pattern…',
  'Matching technique to your goal…',
  'Calibrating session length…',
];

export default function RecommendationScreen({
  techniqueId,
  intentTitle,
  age,
  dailyMinutes,
  baseline,
  stressLevel,
  sleepQuality,
  agreementResponses,
  experienceLevel,
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: RecommendationScreenProps) {
  const mindMap = useMemo(
    () =>
      computeMindMap({
        stressLevel,
        sleepQuality,
        agreementResponses,
        experienceLevel,
      }),
    [stressLevel, sleepQuality, agreementResponses, experienceLevel],
  );
  const [showingResult, setShowingResult] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const resultFade = useRef(new Animated.Value(0)).current;
  const resultSlide = useRef(new Animated.Value(16)).current;

  const technique =
    TECHNIQUE_RECOMMENDATIONS[techniqueId] ?? TECHNIQUE_RECOMMENDATIONS.box;
  const nickname =
    TECHNIQUES.find((t) => t.id === technique.id)?.recommendedName ?? null;

  const hrCompleted = baseline?.completed === true && baseline.avgBpm != null;
  const drop = baseline?.bpmDrop ?? 0;
  const hrDropPositive = hrCompleted && drop > 1;

  const bpmSeries = baseline?.bpmHistory?.length
    ? buildBpmSeries(baseline.bpmHistory, Math.max(1, baseline.durationSec || 20))
    : [];
  const hasGraph = bpmSeries.length >= 2;

  useEffect(() => {
    // Animate progress bar over ~2.2s
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 5600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Cycle through step labels
    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => {
        const next = prev + 1;
        return next >= PERSONALIZING_STEPS.length ? prev : next;
      });
    }, 1600);

    // Reveal result after loading
    const revealTimer = setTimeout(() => {
      clearInterval(stepInterval);
      setShowingResult(true);
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
    }, 5800);

    return () => {
      clearInterval(stepInterval);
      clearTimeout(revealTimer);
    };
  }, [progressAnim, resultFade, resultSlide]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (!showingResult) {
    return (
      <OnboardingScreenLayout
        title="Your Mindmap"
        subtitle="We're building your personalized mindmap and plan based on your responses."
        progress={stepIndex / stepCount}
        onBack={onBack}
        footer={
          <View style={styles.loadingFooter}>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFillBar, { width: progressWidth }]} />
            </View>
            <Text style={styles.loadingStep}>{PERSONALIZING_STEPS[loadingStep]}</Text>
          </View>
        }
      >
        <View style={styles.loadingBody}>
          {/* Pulsing technique card placeholder */}
          <View style={styles.ghostCard}>
            <View style={styles.ghostKicker} />
            <View style={styles.ghostTitle} />
            <View style={styles.ghostTagline} />
            <View style={styles.ghostDivider} />
            <View style={styles.ghostBody} />
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
          <MindMapRadar scores={mindMap.scores} />
        </View>

        <Text style={styles.sectionSubtitle}>Your starting point</Text>

        <View style={styles.techniqueCard}>
          <Text style={styles.techniqueKicker}>RECOMMENDED TECHNIQUE</Text>
          <Text style={styles.techniqueName}>{nickname ?? technique.name}</Text>
          <Text style={styles.techniqueSubname}>{technique.name}</Text>
          <Text style={styles.techniqueTagline}>{technique.tagline}</Text>
          <View style={styles.divider} />
          <Text style={styles.techniqueWhy}>{technique.why}</Text>
        </View>

        {hrCompleted ? (
          <View style={styles.hrCard}>
            <View style={styles.hrCardHeader}>
              <View style={styles.hrCardTitleRow}>
                <View style={styles.hrIconWrap}>
                  <MaterialCommunityIcons
                    name="heart-pulse"
                    size={18}
                    color={colors.error[500]}
                  />
                </View>
                <Text style={styles.hrCardTitle}>Heart response</Text>
              </View>
              {hrDropPositive ? (
                <View style={styles.hrBadge}>
                  <Text style={styles.hrBadgeText}>↓ {drop} bpm</Text>
                </View>
              ) : (
                <View style={[styles.hrBadge, styles.hrBadgeSteady]}>
                  <Text style={[styles.hrBadgeText, styles.hrBadgeTextSteady]}>
                    Steady
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{baseline?.avgBpm}</Text>
                <Text style={styles.statLabel}>Avg BPM</Text>
              </View>
              {baseline?.earlyBpm != null ? (
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{baseline.earlyBpm}</Text>
                  <Text style={styles.statLabel}>Early</Text>
                </View>
              ) : null}
              {baseline?.lateBpm != null ? (
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{baseline.lateBpm}</Text>
                  <Text style={styles.statLabel}>Late</Text>
                </View>
              ) : null}
              {baseline?.durationSec != null && baseline.durationSec > 0 ? (
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{baseline.durationSec}s</Text>
                  <Text style={styles.statLabel}>Duration</Text>
                </View>
              ) : null}
            </View>

            {hasGraph ? (
              <View style={styles.graphWrap}>
                <LineGraph
                  data={bpmSeries}
                  subtitle="BPM during reading"
                  unit=""
                  height={140}
                  lineColor={colors.primary.blue500}
                  fillColor={colors.primary.blue100}
                  dotColor={colors.primary.blue600}
                />
              </View>
            ) : null}
          </View>
        ) : null}
      </Animated.View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  // Loading state
  loadingBody: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingFooter: {
    gap: spacing.sm,
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.primary.blue100,
    overflow: 'hidden',
  },
  progressFillBar: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary.blue600,
  },
  loadingStep: {
    ...typography.body.small,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  ghostCard: {
    ...card.base,
    ...card.shadow,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: 24,
    gap: spacing.sm,
    opacity: 0.45,
  },
  ghostKicker: {
    width: 140,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary.blue200,
  },
  ghostTitle: {
    width: 200,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.neutral[200],
    marginTop: spacing.xs,
  },
  ghostTagline: {
    width: 160,
    height: 16,
    borderRadius: 6,
    backgroundColor: colors.neutral[200],
  },
  ghostDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
    marginVertical: spacing.md,
  },
  ghostBody: {
    width: '100%',
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.neutral[100],
  },

  // Result state
  resultBody: {
    gap: 0,
    marginTop: -spacing.xl,
  },
  hrCard: {
    ...card.base,
    marginTop: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: 18,
    gap: spacing.md,
  },
  hrCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hrCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  hrIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.error[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  hrCardTitle: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
  },
  hrBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.success[100],
    borderWidth: 1,
    borderColor: colors.success[100],
  },
  hrBadgeSteady: {
    backgroundColor: colors.neutral[100],
    borderColor: colors.border.subtle,
  },
  hrBadgeText: {
    ...typography.caption.caption2,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.success[700],
  },
  hrBadgeTextSteady: {
    color: colors.text.secondary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
  },
  statItem: {
    flex: 1,
    gap: spacing.xs,
  },
  statValue: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.4,
    color: colors.text.primary,
  },
  statLabel: {
    ...typography.caption.caption2,
    color: colors.text.tertiary,
  },
  graphWrap: {
    marginTop: spacing.xs,
    overflow: 'hidden',
  },

  mindMapWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
    marginHorizontal: -spacing.lg,
  },
  sectionSubtitle: {
    ...typography.heading.heading2,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 22,
    color: colors.text.primary,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  techniqueCard: {
    ...card.base,
    ...card.shadow,
    marginTop: 0,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: 24,
    gap: spacing.xs,
  },
  techniqueKicker: {
    ...typography.caption.caption2,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    letterSpacing: 2,
    color: colors.primary.blue600,
  },
  techniqueName: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.4,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  techniqueSubname: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.tertiary,
    marginTop: 2,
  },
  techniqueTagline: {
    ...typography.body.medium,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
    marginVertical: spacing.md,
  },
  techniqueWhy: {
    ...typography.body.small,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});
