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
import { card, coloredCard, radius } from '../../../theme/card';
import { padding, spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import Icon from '../../common/icons/Icon';
import GiftBoxArt, { GIFT_BOX_PALE_BLUE } from '../../common/GiftBoxArt';
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
                            <Text style={styles.proBenefitText}>{benefit.label}</Text>
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
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
  },
  section: {
    gap: spacing.md,
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
  proBenefitText: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    flex: 1,
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
