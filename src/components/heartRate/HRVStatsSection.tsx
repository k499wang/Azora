import { StyleSheet, View } from 'react-native';
import { spacing, padding } from '../../theme/spacing';
import SectionHeader from '../common/SectionHeader';
import ProUpgradeButton from '../common/ProUpgradeButton';
import HRVTrackStatCard from './HRVTrackStatCard';
import HRVChart from './HRVChart';
import { colors } from '../../theme/colors';

const RMSSD_INFO = {
  title: 'RMSSD',
  message:
    'Root Mean Square of Successive Differences — a heart rate variability (HRV) measure that reflects parasympathetic (vagal) activity and recovery.\n\nHealthy resting range: 20–80 ms. Higher generally indicates better recovery and cardiovascular health. Varies with age, fitness, and stress.',
};

const LOCKED_PLACEHOLDERS = {
  rmssd: 48,
} as const;

interface HRVSectionProps {
  rmssd?: number | null;
  sdnn?: number | null;
  avgBpm?: number | null;
  ibiMs?: number[];
  locked?: boolean;
  onPressUpgrade?: () => void;
}

export default function HRVStatsSection({
  rmssd,
  sdnn,
  avgBpm,
  ibiMs = [],
  locked = false,
  onPressUpgrade,
}: HRVSectionProps) {
  const rmssdValue = rmssd ?? (locked ? LOCKED_PLACEHOLDERS.rmssd : null);

  return (
    <View style={styles.section}>
      <View style={styles.headerWrap}>
        <SectionHeader
          title="Heart Rate Variability"
          right={locked ? <ProUpgradeButton onPress={onPressUpgrade} /> : null}
        />
      </View>

      <View style={styles.metricColumn}>
        <HRVTrackStatCard
          label="RMSSD"
          icon="stat-rmssd"
          iconColor={colors.primary.blue600}
          value={rmssdValue}
          unit="ms"
          max={80}
          lowBound={20}
          highBound={50}
          info={RMSSD_INFO}
          locked={locked}
          onPressLocked={onPressUpgrade}
          emphasizeValue
          showMeasuredLabel={false}
        />
        <HRVChart
          ibiMs={ibiMs}
          insightSummary={{
            rmssd: rmssd ?? null,
            sdnn: sdnn ?? null,
            avgBpm: avgBpm ?? null,
          }}
          color={colors.error[500]}
          locked={locked}
          onPressLocked={onPressUpgrade}
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
