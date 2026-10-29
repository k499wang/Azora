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
  ReportTraits,
  ReportWeekPath,
  type PlanRevealPhase,
} from '../ProfileReport';
import { colors } from '../../../theme/colors';
import { card, coloredCard, radius } from '../../../theme/card';
import { padding, spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import Icon from '../../common/icons/Icon';
import GiftBoxArt, { GIFT_BOX_PALE_BLUE } from '../../common/GiftBoxArt';
import OnboardingOptionIcon from '../OnboardingOptionIcon';
import type { OnboardingIllustrationName } from '../../common/icons/onboardingIllustrationCatalog';
import OnboardingScreenLayout, { onboardingTitleStyle } from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import { ARCHETYPE_FOR_PLAN, type OnboardingArchetype } from '../../../lib/onboardingArchetype';
import { buildOnboardingReport, type OnboardingReportAnswers } from '../../../lib/onboardingReport';
import type { PresetId } from '../../../lib/onboardingPreset';
import type { MindMapScore } from '../../../lib/onboardingScores';
import { ONBOARDING_VISUAL_MAX_WIDTH } from '../onboardingVisualScale';
import type { OnboardingIntent } from '../types';
import type { BrainTrait } from '../../../lib/onboardingBrainTraits';

export type { PlanRevealPhase } from '../ProfileReport';

interface PlanRevealScreenProps {
  /** The personality profile appears before the plan report. */
  phase: PlanRevealPhase;
  planId: PresetId;
  /** Overrides the plan's own archetype when the answers name a sharper one. */
  archetype?: OnboardingArchetype;
  presetRevision?: number;
  intent?: OnboardingIntent;
  reportAnswers: OnboardingReportAnswers;
  /** The personality profile uses scores; the plan uses real facts. */
  scores?: MindMapScore[];
  targetScores?: MindMapScore[];
  /** Traits read from their answers, shown on the profile only. */
  brainTraits?: readonly BrainTrait[];
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

const TITLES: Record<PlanRevealPhase, string> = {
  diagnosis: 'Your Azora personality profile',
  // The report promises where the plan lands rather than reciting what it contains.
  plan: 'Here’s where you’ll be after your plan',
};

const BUTTON_LABELS: Record<PlanRevealPhase, string> = {
  diagnosis: 'See my plan',
  plan: 'See what’s ahead',
};

const PRO_HUE = colors.playful.sky;
const PRO_GIFT_SIZE = 88;
const PRO_GIFT_PEEK = spacing.xl;
const PRO_BENEFIT_ICON_SIZE = 36;

function proBenefits(weeks: number): readonly { icon: OnboardingIllustrationName; label: string }[] {
  return [
    { icon: 'calendar-check-outline', label: `Your full ${weeks}-week personalized plan` },
    { icon: 'chart-line-variant', label: 'Personalized mood insights' },
    { icon: 'message', label: 'Azo’s AI helper' },
  ];
}

export default function PlanRevealScreen({
  phase,
  planId,
  archetype = ARCHETYPE_FOR_PLAN[planId],
  presetRevision,
  intent,
  reportAnswers,
  scores = [],
  targetScores = [],
  brainTraits = [],
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: PlanRevealScreenProps) {
  const { width } = useWindowDimensions();
  const hue = PLAN_HUE[planId];
  const report = buildOnboardingReport(planId, reportAnswers, presetRevision, intent);

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
                  // Who they become, not the plan's own name: the plan is already
                  // theirs in the title above this block.
                  eyebrow: 'Who you’re becoming',
                  name: archetype.futureName,
                  line: archetype.planPromise,
                },
              }}
            />

            <View style={styles.radarSlot}>
              <MindMapRadar
                scores={scores}
                targetScores={targetScores}
                // Today's shape on the profile; the aim grows out of it on the report.
                showTarget={phase === 'plan'}
                size={Math.min(width - padding.screen.horizontal * 2, ONBOARDING_VISUAL_MAX_WIDTH)}
              />
              {phase === 'plan' ? (
                <Text style={styles.projectionNote}>Your progress may differ.</Text>
              ) : null}
            </View>

            <View style={styles.divider} />

            {phase === 'diagnosis' ? (
              <>
                <ReportTraits traits={brainTraits} />
                <ReportAnswerSummary items={report.summary} />
              </>
            ) : (
              <ReportInsights
                heading="Why this plan fits you"
                lines={report.courseWelcome.reason == null
                  ? report.fitLines
                  : [report.courseWelcome.reason, report.fitLines[0]]}
                icon="lightbulb-on-outline"
              />
            )}

            {phase === 'plan' && (
              <>
                <ReportInsights
                  heading="What you’re working toward"
                  lines={[report.courseWelcome.outcome]}
                  icon="target"
                />

                <ReportWeekPath hue={hue} weeks={report.courseWelcome.weeks} />

                <View style={styles.proWrap}>
                  <View style={card.blockShadow}>
                    <View style={[card.block, coloredCard(PRO_HUE), styles.proCard]}>
                      <View style={styles.proHeader}>
                        <View style={styles.proBadge}>
                          <Icon name="sparkle" size={14} color={PRO_HUE.ink} />
                          <Text style={styles.proBadgeText}>PRO</Text>
                        </View>
                        <Text style={styles.proHeading}>Keep the momentum with Azora Pro</Text>
                      </View>
                      <View style={styles.proBenefits}>
                        {proBenefits(report.planFacts.weeks).map((benefit) => (
                          <View key={benefit.label} style={styles.proBenefit}>
                            <View
                              accessibilityElementsHidden
                              importantForAccessibility="no-hide-descendants"
                            >
                              <OnboardingOptionIcon name={benefit.icon} size={PRO_BENEFIT_ICON_SIZE} />
                            </View>
                            <View style={styles.proBenefitCopy}>
                              <Text style={styles.proBenefitText}>{benefit.label}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                      <Text style={styles.proFootnote}>Your next practice is ready when you are.</Text>
                    </View>
                  </View>
                  <View
                    style={styles.proGift}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                  >
                    <GiftBoxArt size={PRO_GIFT_SIZE} palette={GIFT_BOX_PALE_BLUE} />
                  </View>
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
  projectionNote: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.mdPlus,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
  },
  // Leaves room above the card for the gift to peek over its top edge.
  proWrap: {
    paddingTop: PRO_GIFT_PEEK,
  },
  proCard: {
    borderBottomWidth: 5,
    padding: spacing.lg,
    gap: spacing.md,
  },
  proHeader: {
    gap: spacing.sm,
    paddingRight: PRO_GIFT_SIZE - spacing.md,
  },
  proGift: {
    position: 'absolute',
    top: 0,
    right: spacing.sm,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.reward.gold,
  },
  proBadgeText: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    color: PRO_HUE.ink,
  },
  proHeading: {
    ...typography.heading.heading1,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
  },
  proBenefits: {
    gap: spacing.sm,
  },
  proBenefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  proBenefitCopy: {
    flex: 1,
  },
  proBenefitText: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
  },
  proFootnote: {
    ...typography.body.small,
    color: colors.onBlock.textMuted,
  },
  reassurance: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
});
