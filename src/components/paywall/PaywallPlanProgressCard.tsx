import { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '../common/Text';
import Icon from '../common/icons/Icon';
import MindMapRadar from '../onboarding/MindMapRadar';
import { projectScores } from '../../lib/paywallPersonalization';
import type { MindMapScore } from '../../lib/onboardingScores';
import { card, radius } from '../../theme/card';
import { breakpoints } from '../../theme/breakpoints';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { triggerTapHaptic } from '../../native/tapHaptics';

export function PaywallPlanProgressCard({ scores, finishDate }: {
  scores: MindMapScore[];
  finishDate: string;
}) {
  const [showTarget, setShowTarget] = useState(false);
  const { width } = useWindowDimensions();
  const radarSize = Math.min(width, breakpoints.dashboardContentMaxWidth) - spacing.lg * 2;

  return (
    <View style={styles.transformationCard}>
      <Text style={styles.transformationTitle}>
        {showTarget ? `Your goals by ${finishDate}` : 'Where you’re starting today'}
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
  pressed: {
    opacity: 0.7,
  },
});
