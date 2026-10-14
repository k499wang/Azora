import { useState } from 'react';
import { Image, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '../../common/Text';
import Icon from '../../common/icons/Icon';
import MindMapRadar from '../../onboarding/MindMapRadar';
import PlanJourney, { type PlanJourneyStop } from '../../onboarding/PlanJourney';
import { projectScores } from '../../../lib/paywallPersonalization';
import type { MindMapScore } from '../../../lib/onboardingScores';
import type { personalizedPaywallPlan } from '../../../lib/paywall/paywallLongForm';
import { card, radius } from '../../../theme/card';
import { breakpoints } from '../../../theme/breakpoints';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { triggerTapHaptic } from '../../../native/tapHaptics';
import { PaywallSection } from './PaywallSection';

interface PaywallPlanStoryProps {
  plan: ReturnType<typeof personalizedPaywallPlan>;
  scores?: MindMapScore[];
}

const MILESTONE_MARKS = [
  { icon: 'breath-leaf', hue: colors.playful.sky },
  { icon: 'streak', hue: colors.playful.violet },
  { icon: 'star', hue: colors.playful.amber },
] as const;
const AZO_HEAD = require('../../../../assets/mascot/azo-head.png');

/** The same assessment and projection as onboarding, followed by the plan's milestones. */
export function PaywallPlanStory({ plan, scores }: PaywallPlanStoryProps) {
  const [showTarget, setShowTarget] = useState(false);
  const { width } = useWindowDimensions();
  const radarSize = Math.min(width, breakpoints.dashboardContentMaxWidth) - spacing.lg * 2;
  const journey: PlanJourneyStop[] = [
    {
      day: 1,
      title: 'One small step',
      line: 'Start where you are. A little time for yourself is enough for today.',
      icon: 'walk',
      accent: colors.playful.teal.ink,
      backgroundColor: colors.playful.teal.soft,
      iconBackgroundColor: colors.playful.teal.tint,
    },
    ...plan.milestones.map((milestone, index) => {
      const { icon, hue } = MILESTONE_MARKS[index];
      return {
        day: milestone.day,
        title: milestone.title,
        targetDate: `Target ${milestone.date}`,
        line: milestone.outcome,
        icon,
        accent: hue.ink,
        backgroundColor: hue.soft,
        iconBackgroundColor: hue.tint,
      };
    }),
  ];

  return (
    <>
      {scores != null && scores.length > 0 ? (
        <PaywallSection title="See the change you’re working toward">
          <View style={styles.transformationCard}>
            <Text style={styles.transformationTitle}>
              {showTarget ? `Your goals by ${plan.finishDate}` : 'Where you’re starting today'}
            </Text>
            <View style={styles.phasePicker}>
              {[false, true].map((target) => (
                <Pressable
                  key={String(target)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: showTarget === target }}
                  onPress={() => {
                    triggerTapHaptic();
                    setShowTarget(target);
                  }}
                  style={({ pressed }) => [
                    styles.phaseButton,
                    showTarget === target && styles.phaseSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.phaseLabel, showTarget === target && styles.phaseLabelSelected]}>
                    {target ? 'With your plan' : 'Today'}
                  </Text>
                  {target ? <Icon name="sparkle" size={16} color={showTarget ? colors.neutral[0] : colors.primary.blue500} /> : null}
                </Pressable>
              ))}
            </View>
            <View style={styles.radar}>
              <MindMapRadar
                scores={scores}
                targetScores={projectScores(scores)}
                showTarget={showTarget}
                size={radarSize}
              />
            </View>
            <Text style={styles.chartNote}>
              {showTarget
                ? 'A picture of your goals. Small steps, at your own pace.'
                : 'Tap “With your plan” to see what you’re building toward.'}
            </Text>
          </View>
        </PaywallSection>
      ) : null}

      <PaywallSection title={`Your journey to ${plan.planName}`}>
        <View style={styles.goalCard}>
          <View style={styles.goalIcon}>
            <Icon name="calendar-check-outline" size={28} color={colors.playful.teal.ink} />
          </View>
          <View style={styles.goalCopy}>
            <Text style={styles.goalEyebrow}>Your target · {plan.finishDate}</Text>
            <Text style={styles.goalTitle}>Your plan to {plan.goal}</Text>
            <Text style={styles.goalDetail}>{plan.days} days of small, guided steps</Text>
          </View>
        </View>

        <View style={styles.companion} accessible accessibilityLabel="Azo says: I’ll be right here, one small step at a time.">
          <Image source={AZO_HEAD} style={styles.azo} resizeMode="contain" accessible={false} />
          <View style={styles.companionBubble}>
            <View style={styles.bubbleTail} />
            <Text style={styles.companionMessage}>I’ll be right here, one small step at a time.</Text>
          </View>
        </View>
        <PlanJourney stops={journey} cardWidth={0.86} />
        <Text style={styles.destinationNote}>A new rhythm to be proud of. A little more like you.</Text>
        <Text style={styles.paceNote}>
          Target dates assume one plan day each day, starting today. Miss a day? Your plan waits for you.
        </Text>
      </PaywallSection>
    </>
  );
}

const styles = StyleSheet.create({
  transformationCard: {
    ...card.base,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  transformationTitle: {
    ...typography.title.title3,
    color: colors.text.primary,
    textAlign: 'center',
  },
  phasePicker: {
    flexDirection: 'row',
    backgroundColor: colors.background.canvas,
    borderRadius: radius.full,
    padding: spacing.xs,
  },
  phaseButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  phaseSelected: {
    backgroundColor: colors.primary.blue500,
  },
  phaseLabel: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
  },
  phaseLabelSelected: {
    color: colors.neutral[0],
  },
  radar: {
    alignItems: 'center',
    marginHorizontal: -spacing.md,
    marginTop: spacing.sm,
  },
  chartNote: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  goalCard: {
    ...card.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.playful.teal.tint,
  },
  goalIcon: {
    backgroundColor: colors.playful.teal.soft,
    padding: spacing.sm,
    borderRadius: radius.medium,
  },
  goalCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  goalEyebrow: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    color: colors.playful.teal.ink,
  },
  goalTitle: {
    ...typography.heading.heading1,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  goalDetail: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  companion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  azo: {
    width: 76,
    height: 76,
  },
  companionBubble: {
    ...card.base,
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.playful.teal.soft,
  },
  bubbleTail: {
    position: 'absolute',
    left: -6,
    top: '50%',
    width: 12,
    height: 12,
    backgroundColor: colors.playful.teal.soft,
    transform: [{ rotate: '45deg' }],
  },
  companionMessage: {
    ...typography.body.medium,
    color: colors.playful.teal.ink,
  },
  destinationNote: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.playful.amber.ink,
    textAlign: 'center',
  },
  paceNote: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
