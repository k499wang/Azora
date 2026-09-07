import { StyleSheet, View } from 'react-native';
import { spacing, padding } from '../../theme/spacing';
import SectionHeader from '../common/SectionHeader';
import ProUpgradeButton from '../common/ProUpgradeButton';
import BPMChart from './BPMChart';
import RestingHeartRateBar from './RestingHeartRateBar';
import type { BpmTimePoint } from '../../lib/heartRate/bpmSeries';
import type {
  BpmInsightContext,
  BreathingTechniqueBpmProfile,
} from '../../lib/heartRate/bpmInsight';
import { colors } from '../../theme/colors';

interface HeartRateSectionProps {
  hrDrop?: number | null;
  minBpm?: number | null;
  maxBpm?: number | null;
  avgBpm?: number | null;
  age?: number | null;
  bpmSamples?: BpmTimePoint[];
  locked?: boolean;
  onPressUpgrade?: () => void;
  emptyChartMessage?: string;
  insightContext?: BpmInsightContext;
  breathingTechniqueProfile?: BreathingTechniqueBpmProfile | null;
  numberForwardSummary?: boolean;
}

export default function HeartRateStatsSection({
  hrDrop,
  minBpm,
  maxBpm,
  avgBpm,
  age,
  bpmSamples = [],
  locked = false,
  onPressUpgrade,
  emptyChartMessage,
  insightContext,
  breathingTechniqueProfile,
  numberForwardSummary = false,
}: HeartRateSectionProps) {
  const isBreathHold = insightContext === 'breath-hold';

  return (
    <View style={styles.section}>
      <View style={styles.headerWrap}>
        <SectionHeader
          title={isBreathHold ? 'Hold Statistics' : 'Heart Rate'}
          right={locked ? <ProUpgradeButton onPress={onPressUpgrade} /> : null}
        />
      </View>

      <View style={styles.metricColumn}>
        <RestingHeartRateBar
          bpm={avgBpm ?? null}
          age={age ?? null}
          title="Average heart rate"
          emphasizeValue={numberForwardSummary}
          locked={locked}
          onPressLocked={onPressUpgrade}
        />

        <BPMChart
          bpmSamples={bpmSamples}
          insightSummary={{
            avgBpm: avgBpm ?? null,
            minBpm: minBpm ?? null,
            maxBpm: maxBpm ?? null,
            hrDrop: hrDrop ?? null,
          }}
          color={colors.primary.blue500}
          locked={locked}
          onPressLocked={onPressUpgrade}
          emptyMessage={emptyChartMessage}
          insightContext={insightContext}
          breathingTechniqueProfile={breathingTechniqueProfile}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.lg,
  },
  headerWrap: {
    paddingHorizontal: padding.screen.horizontal,
  },
  metricColumn: {
    flexDirection: 'column',
    gap: spacing.sm,
    paddingHorizontal: padding.screen.horizontal,
  },
});
