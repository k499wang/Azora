import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, padding } from '../../theme/spacing';
import SectionHeader from '../common/SectionHeader';
import ProUpgradeButton from '../common/ProUpgradeButton';
import BPMChart from './BPMChart';
import RestingHeartRateBar from './RestingHeartRateBar';
import ThermometerStatCard from './ThermometerStatCard';
import type { BpmTimePoint } from '../../lib/heartRate/bpmSeries';

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
}: HeartRateSectionProps) {
  const heartRateIncreased = hrDrop != null && hrDrop < 0;

  return (
    <View style={styles.section}>
      <View style={styles.headerWrap}>
        <SectionHeader
          title="Heart rate"
          right={locked ? <ProUpgradeButton onPress={onPressUpgrade} /> : null}
        />
      </View>

      <View style={styles.metricColumn}>
        <View style={styles.tileRow}>
          <ThermometerStatCard
            label={heartRateIncreased ? 'HR increase' : 'HR drop'}
            icon={heartRateIncreased ? 'stat-heart-pulse' : 'chevron-down'}
            iconColor={colors.error[500]}
            value={hrDrop ?? (locked ? LOCKED_PLACEHOLDERS.hrDrop : null)}
            unit="bpm"
            min={0}
            max={40}
            accent={colors.primary.blue500}
            locked={locked}
            onPressLocked={onPressUpgrade}
          />
          <ThermometerStatCard
            label="Lowest HR"
            icon="moon"
            iconColor={colors.error[500]}
            value={minBpm ?? (locked ? LOCKED_PLACEHOLDERS.minBpm : null)}
            unit="bpm"
            min={40}
            max={90}
            accent={colors.error[500]}
            locked={locked}
            onPressLocked={onPressUpgrade}
          />
        </View>

        <RestingHeartRateBar
          bpm={avgBpm ?? null}
          age={age ?? null}
          title="Average heart rate"
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
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
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
});
