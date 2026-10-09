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
import { card } from '../../../theme/card';
import { padding, spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import OnboardingOptionIcon from '../OnboardingOptionIcon';
import type { OnboardingIllustrationName } from '../../common/icons/onboardingIllustrationCatalog';
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
  plan: 'Your next chapter starts here',
};

const BUTTON_LABELS: Record<PlanRevealPhase, string> = {
  diagnosis: 'See my plan',
  plan: 'Show me my first step',
};

const PLAN_INCLUSIONS: readonly {
  icon: OnboardingIllustrationName;
  title: string;
  benefit: string;
}[] = [
  {
    icon: 'breath-leaf',
    title: 'Short, guided practices',
    benefit: 'Follow a breathing or attention reset chosen for your plan, even on busy days.',
  },
  {
    icon: 'book',
    title: 'Practical daily lessons',
    benefit: 'Understand the habit you’re building and take it into your day.',
  },
  {
    icon: 'chart-line-variant',
    title: 'See your small wins',
    benefit: 'Check in with how you feel and watch your completed days add up.',
  },
];

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

            {phase === 'plan' && (
              <View style={styles.section}>
                <Text style={styles.planDescription}>
                  Your daily guide: short practices, practical lessons and mood check-ins.
                  Start small and build a routine you can keep.
                </Text>
                <ReportTiles
                  tiles={[
                    { label: 'Guided plan', value: `${report.planFacts.weeks} weeks`, icon: 'calendar', hue },
                    { label: 'Day-one practices', value: `${report.planFacts.firstDayMinutes} min`, icon: 'timer', hue },
                  ]}
                />
              </View>
            )}

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

            {phase === 'plan' && (
              <>
                <View style={styles.section}>
                  <Text style={styles.sectionHeading}>What you get with your plan</Text>
                  {PLAN_INCLUSIONS.map((item) => (
                    <View key={item.title} style={styles.inclusion}>
                      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                        <OnboardingOptionIcon name={item.icon} size={32} />
                      </View>
                      <View style={styles.inclusionCopy}>
                        <Text style={styles.inclusionTitle}>{item.title}</Text>
                        <Text style={styles.detail}>{item.benefit}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                <View style={[styles.valueCard, { backgroundColor: colors.playful[hue].tint }]}>
                  <Text style={[styles.sectionHeading, { color: colors.playful[hue].ink }]}>
                    Try this today
                  </Text>
                  <Text style={styles.tipAction}>{report.practiceTip.action}</Text>
                  <Text style={styles.detail}>{report.practiceTip.why}</Text>
                </View>

                <View style={styles.proCard}>
                  <Text style={styles.sectionHeading}>Keep the momentum with Azora Pro</Text>
                  <Text style={styles.detail}>
                    Unlock your full {report.planFacts.weeks}-week plan, unlimited exercises and
                    the full exercise library. Your next practice is ready when you are.
                  </Text>
                </View>
              </>
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
  section: {
    gap: spacing.md,
  },
  planDescription: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  sectionHeading: {
    ...typography.heading.heading1,
    color: colors.text.primary,
  },
  inclusion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  inclusionCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  inclusionTitle: {
    ...typography.heading.heading2,
    color: colors.text.primary,
  },
  detail: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  valueCard: {
    ...card.base,
    padding: spacing.md,
    gap: spacing.sm,
  },
  tipAction: {
    ...typography.body.medium,
    color: colors.text.primary,
  },
  proCard: {
    ...card.base,
    backgroundColor: colors.primary.blue100,
    padding: spacing.md,
    gap: spacing.sm,
  },
  reassurance: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
});
