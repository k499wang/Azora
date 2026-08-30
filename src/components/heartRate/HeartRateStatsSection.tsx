import { StyleSheet, View } from 'react-native';
import { spacing, padding } from '../../theme/spacing';
import SectionHeader from '../common/SectionHeader';
import ProUpgradeButton from '../common/ProUpgradeButton';
import BPMChart from './BPMChart';
import RestingHeartRateBar from './RestingHeartRateBar';
import ThermometerStatCard from './ThermometerStatCard';
import type { BpmTimePoint } from '../../lib/heartRate/bpmSeries';
import type {
  BpmInsightContext,
  BreathingTechniqueBpmProfile,
} from '../../lib/heartRate/bpmInsight';
import { colors } from '../../theme/colors';

const LOCKED_PLACEHOLDERS = {
  hrDrop: 18,
  minBpm: 54,
} as const;

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
  /** Places the three peer summary cards in one row when the window can hold them. */
  useSummaryRow?: boolean;
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
  useSummaryRow = false,
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
        <View style={[styles.summaryCards, useSummaryRow && styles.summaryRow]}>
          <View style={[styles.tileRow, useSummaryRow && styles.tileRowWide]}>
            <ThermometerStatCard
              label="HR change"
              icon="stat-heart-rate-change"
              value={hrDrop ?? (locked ? LOCKED_PLACEHOLDERS.hrDrop : null)}
              unit="bpm"
              min={0}
              max={40}
              accent={colors.primary.blue500}
              iconColor={colors.primary.blue600}
              presentation={numberForwardSummary ? 'number' : 'thermometer'}
              locked={locked}
              onPressLocked={onPressUpgrade}
              style={useSummaryRow ? styles.summaryCardFill : undefined}
            />
            <ThermometerStatCard
              label="Lowest HR"
              icon="stat-lowest-heart-rate"
              value={minBpm ?? (locked ? LOCKED_PLACEHOLDERS.minBpm : null)}
              unit="bpm"
              min={40}
              max={90}
              accent={colors.error[500]}
              iconColor={colors.primary.blue600}
              presentation={numberForwardSummary ? 'number' : 'thermometer'}
              locked={locked}
              onPressLocked={onPressUpgrade}
              style={useSummaryRow ? styles.summaryCardFill : undefined}
            />
          </View>

          <RestingHeartRateBar
            bpm={avgBpm ?? null}
            age={age ?? null}
            title="Average heart rate"
            emphasizeValue={numberForwardSummary}
            locked={locked}
            onPressLocked={onPressUpgrade}
            containerStyle={useSummaryRow ? styles.averageCardWide : undefined}
            style={useSummaryRow ? styles.summaryCardFill : undefined}
          />
        </View>

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
  tileRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  summaryCards: {
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  tileRowWide: {
    flex: 2,
  },
  averageCardWide: {
    flex: 1,
  },
  summaryCardFill: {
    flex: 1,
  },
});
