import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { LayoutAnimationConfig } from 'react-native-reanimated';
import ClipboardCard from '../../common/ClipboardCard';
import { Text } from '../../common/Text';
import MindMapRadar from '../MindMapRadar';
import OnboardingProofStrip from '../OnboardingProofStrip';
import {
  PLAN_HUE,
  PhaseSwap,
  ReportAnswerSummary,
  ReportIdentity,
  ReportInsights,
  ReportTiles,
  type PlanRevealPhase,
} from '../ProfileReport';
import { colors } from '../../../theme/colors';
import { padding, spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import OnboardingScreenLayout, { onboardingTitleStyle } from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import { ARCHETYPE_FOR_PLAN } from '../../../lib/onboardingArchetype';
import { buildOnboardingReport, type OnboardingReportAnswers } from '../../../lib/onboardingReport';
import type { PresetId } from '../../../lib/onboardingPreset';
import type { MindMapScore } from '../../../lib/onboardingScores';
import { ONBOARDING_VISUAL_MAX_WIDTH } from '../onboardingVisualScale';

export type { PlanRevealPhase } from '../ProfileReport';

interface PlanRevealScreenProps {
  /**
   * Two onboarding steps share this screen so the report stays mounted
   * between them: flipping the phase grows the goal in place and swaps what
   * sits around it, instead of fading one screen out and another in.
   */
  phase: PlanRevealPhase;
  planId: PresetId;
  reportAnswers: OnboardingReportAnswers;
  scores: MindMapScore[];
  targetScores: MindMapScore[];
  superpower: MindMapScore;
  growthArea: MindMapScore;
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

const TITLES: Record<PlanRevealPhase, string> = {
  diagnosis: 'Your Azora personality profile',
  plan: 'Where your plan takes you',
};

const BUTTON_LABELS: Record<PlanRevealPhase, string> = {
  diagnosis: 'See my plan',
  plan: 'Continue',
};

export default function PlanRevealScreen({
  phase,
  planId,
  reportAnswers,
  scores,
  targetScores,
  superpower,
  growthArea,
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: PlanRevealScreenProps) {
  const { width } = useWindowDimensions();
  const archetype = ARCHETYPE_FOR_PLAN[planId];
  const hue = PLAN_HUE[planId];
  const report = buildOnboardingReport(planId, reportAnswers);

  return (
    <OnboardingScreenLayout
      title={TITLES[phase]}
      titleSlot={
        <PhaseSwap
          phase={phase}
          views={{
            diagnosis: <Text style={onboardingTitleStyle}>{TITLES.diagnosis}</Text>,
            plan: <Text style={onboardingTitleStyle}>{TITLES.plan}</Text>,
          }}
        />
      }
      progress={stepIndex / stepCount}
      onBack={onBack}
      scrollResetKey={phase}
      footer={<OnboardingPrimaryButton label={BUTTON_LABELS[phase]} onPress={onContinue} />}
    >
      <LayoutAnimationConfig skipEntering>
        <View style={styles.page}>
          <ClipboardCard style={styles.report}>
            <ReportIdentity
              phase={phase}
              hue={hue}
              views={{
                diagnosis: {
                  eyebrow: 'Your personality',
                  name: archetype.name,
                  line: archetype.tagline,
                },
                plan: {
                  eyebrow: 'Your next chapter',
                  name: archetype.planName,
                  line: archetype.planPromise,
                },
              }}
            />

            <View style={styles.radarSlot}>
              <MindMapRadar
                scores={scores}
                targetScores={targetScores}
                showTarget={phase === 'plan'}
                size={Math.min(width - padding.screen.horizontal * 2, ONBOARDING_VISUAL_MAX_WIDTH)}
              />
            </View>

            <PhaseSwap
              phase={phase}
              views={{
                diagnosis: (
                  <ReportTiles
                    tiles={[
                      { label: 'Your superpower', value: superpower.label, icon: 'star', hue: 'teal' },
                      { label: 'Needs care', value: growthArea.label, icon: 'heart', hue: 'coral' },
                    ]}
                  />
                ),
                plan: (
                  <ReportTiles
                    tiles={[
                      { label: 'Biggest gain', value: growthArea.label, icon: 'arrow-up', hue: 'sky' },
                      { label: 'Keeps strong', value: superpower.label, icon: 'star', hue: 'teal' },
                    ]}
                  />
                ),
              }}
            />

            <View style={styles.divider} />

            {phase === 'diagnosis' ? (
              <ReportAnswerSummary items={report.summary} />
            ) : (
              <ReportInsights
                heading="Why this plan fits you"
                lines={report.fitLines}
                icon="lightbulb-on-outline"
              />
            )}
            <Text style={styles.reassurance}>{report.reassurance}</Text>

            <View style={styles.divider} />
            <OnboardingProofStrip />
          </ClipboardCard>
        </View>
      </LayoutAnimationConfig>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.lg,
    marginTop: -spacing.md,
  },
  report: {
    gap: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.mdPlus,
  },
  // Bleeds to the card's edges so the chips get the card's full width.
  radarSlot: {
    alignItems: 'center',
    marginHorizontal: -spacing.mdPlus,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
  },
  reassurance: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
});
