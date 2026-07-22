import { Text } from '../../common/Text';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { card } from '../../../theme/card';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import { TECHNIQUE_RECOMMENDATIONS } from '../data/techniqueRecommendations';
import TECHNIQUES from '../../../features/exercise/guidedBreathing/techniques';
import type { BaselineResult } from './BaselineScreen';
import LineGraph, { type DataPoint } from '../../analytics/LineGraph';

interface RecommendedExerciseScreenProps {
  techniqueId: string;
  baseline: BaselineResult | null;
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

export default function RecommendedExerciseScreen({
  techniqueId,
  baseline,
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: RecommendedExerciseScreenProps) {
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

  return (
    <OnboardingScreenLayout
      title="What we recommend for you."
      subtitle="Chosen just for you. Give it a try once you're in the app!"
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Sounds good" onPress={onContinue} />}
    >
      <View style={styles.techniqueCard}>
        <Text style={styles.techniqueKicker}>Recommended for you</Text>
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
              <Text style={styles.hrCardTitle}>Your starting point</Text>
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
            {baseline?.bpmDrop != null ? (
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{Math.abs(baseline.bpmDrop)}</Text>
                <Text style={styles.statLabel}>BPM range</Text>
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
                subtitle="Today's baseline"
                unit=""
                height={140}
                lineColor={colors.primary.blue500}
                fillColor={colors.primary.blue100}
                dotColor={colors.primary.blue600}
              />
            </View>
          ) : null}

          <Text style={styles.hrFootnote}>
            This is today. Come back every day and watch it improve.
          </Text>
        </View>
      ) : null}
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  techniqueCard: {
    ...card.base,
    ...card.shadow,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: 24,
    gap: spacing.xs,
  },
  techniqueKicker: {
    ...typography.caption.caption2,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    letterSpacing: 0.3,
    color: colors.primary.blue600,
  },
  techniqueName: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.4,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  techniqueSubname: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '500',
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
  hrCard: {
    ...card.base,
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
    fontWeight: '500',
    color: colors.text.primary,
  },
  hrBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
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
    fontWeight: '500',
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
    fontWeight: '500',
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
  hrFootnote: {
    ...typography.caption.caption2,
    color: colors.text.secondary,
    lineHeight: 18,
  },
});
