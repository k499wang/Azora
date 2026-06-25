import { Text, useWindowDimensions, View } from 'react-native';
import type { PaywallPersonalization } from '../../../lib/paywallPersonalization';
import { colors } from '../../../theme/colors';
import MindMapRadar from '../MindMapRadar';
import { paywallStepStyles as styles } from './paywallStepStyles';

const milestones: Array<{ day: string; title: string; body: string }> = [
  { day: 'Day 1', title: 'Start today', body: 'Your first guided session, paced to your baseline.' },
  { day: 'Day 7', title: 'Momentum', body: 'Daily reps build the first signs of calmer breathing.' },
  { day: 'Day 21', title: 'Past the hard part', body: 'The neuroscience-backed threshold where habits stick.' },
  { day: 'Day 30', title: 'Habit locked in', body: 'A steadier baseline you can feel — and measure.' },
];

interface PaywallPersonalizedPlanStepProps {
  personalization: PaywallPersonalization;
}

export function PaywallPersonalizedPlanStep({
  personalization,
}: PaywallPersonalizedPlanStepProps) {
  const { width } = useWindowDimensions();
  const { displayName, baselineBpm, currentScores, targetScores } = personalization;
  const greeting = displayName
    ? `${displayName}, try your plan for free`
    : 'Try your plan for free';

  return (
    <View style={styles.stepContainer}>
      <View style={styles.valueHeader}>
        <Text style={styles.planHeadline}>{greeting}</Text>
        <View style={styles.valueTitleUnderline} />
        <Text style={styles.valueSubtitle}>Built around your baseline — 30 days to a steadier you.</Text>
      </View>

      {currentScores ? (
        <View style={styles.radarBlock}>
          <View style={styles.radarWrap}>
            <MindMapRadar
              scores={currentScores}
              targetScores={targetScores ?? undefined}
              size={width}
            />
          </View>
          <View style={styles.radarLegend}>
            <View style={styles.radarLegendItem}>
              <View style={[styles.radarLegendDot, { backgroundColor: colors.primary.blue500 }]} />
              <Text style={styles.radarLegendLabel}>Today</Text>
            </View>
            <View style={styles.radarLegendItem}>
              <View style={[styles.radarLegendDot, styles.radarLegendDotTarget]} />
              <Text style={styles.radarLegendLabel}>Day 30 target</Text>
            </View>
          </View>
          {baselineBpm != null ? (
            <View style={styles.radarFooter}>
              <Text style={styles.radarFooterLabel}>Resting heart rate</Text>
              <Text style={styles.radarFooterValue}>{baselineBpm} bpm</Text>
            </View>
          ) : null}
        </View>
      ) : baselineBpm != null ? (
        <View style={styles.baselineStrip}>
          <View style={styles.baselineChip}>
            <Text style={styles.baselineChipValue}>{baselineBpm}</Text>
            <Text style={styles.baselineChipLabel}>resting bpm</Text>
          </View>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Your roadmap</Text>

      <View style={styles.ladder}>
        {milestones.map((m, index) => {
          const isFinal = index === milestones.length - 1;
          return (
            <View key={m.day} style={styles.ladderRow}>
              <View style={styles.ladderRail}>
                <View style={[styles.ladderNode, isFinal && styles.ladderNodeFinal]}>
                  {isFinal ? <View style={styles.ladderNodeInner} /> : null}
                </View>
                {index < milestones.length - 1 ? <View style={styles.ladderLine} /> : null}
              </View>
              <View style={styles.ladderCopy}>
                <Text style={styles.ladderDay}>{m.day}</Text>
                <Text style={styles.ladderTitle}>{m.title}</Text>
                <Text style={styles.ladderBody}>{m.body}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default PaywallPersonalizedPlanStep;
