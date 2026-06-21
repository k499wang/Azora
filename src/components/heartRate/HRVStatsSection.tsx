import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, padding } from '../../theme/spacing';
import SectionHeader from '../common/SectionHeader';
import ProUpgradeButton from '../common/ProUpgradeButton';
import HRVTrackStatCard from './HRVTrackStatCard';
import HRVChart from './HRVChart';

const RMSSD_INFO = {
  title: 'RMSSD',
  message:
    'Root Mean Square of Successive Differences — a heart rate variability (HRV) measure that reflects parasympathetic (vagal) activity and recovery.\n\nHealthy resting range: 20–80 ms. Higher generally indicates better recovery and cardiovascular health. Varies with age, fitness, and stress.',
};

const SDNN_INFO = {
  title: 'Avg HRV (SDNN)',
  message:
    'Standard Deviation of NN intervals — an overall measure of heart rate variability across the session.\n\nHealthy resting: 30–60 ms in short readings. Higher SDNN reflects a more adaptable autonomic nervous system.',
};

const LOCKED_PLACEHOLDERS = {
  rmssd: 48,
  sdnn: 42,
} as const;

interface HRVSectionProps {
  rmssd?: number | null;
  sdnn?: number | null;
  avgBpm?: number | null;
  ibiMs?: number[];
  locked?: boolean;
  onPressUpgrade?: () => void;
  lastMeasuredLabel?: string;
}

export default function HRVStatsSection({
  rmssd,
  sdnn,
  avgBpm,
  ibiMs = [],
  locked = false,
  onPressUpgrade,
  lastMeasuredLabel,
}: HRVSectionProps) {
  const rmssdValue = rmssd ?? (locked ? LOCKED_PLACEHOLDERS.rmssd : null);
  const sdnnValue = sdnn ?? (locked ? LOCKED_PLACEHOLDERS.sdnn : null);

  return (
    <View style={styles.section}>
      <View style={styles.headerWrap}>
        <SectionHeader
          title="Heart rate variability"
          right={locked ? <ProUpgradeButton onPress={onPressUpgrade} /> : null}
        />
      </View>

      <View style={styles.metricColumn}>
        <HRVTrackStatCard
          label="RMSSD"
          icon="heart-rmssd"
          iconColor={colors.primary.blue500}
          value={rmssdValue}
          unit="ms"
          max={80}
          lowBound={20}
          highBound={50}
          info={RMSSD_INFO}
          locked={locked}
          onPressLocked={onPressUpgrade}
          lastMeasuredLabel={lastMeasuredLabel}
        />
        <HRVTrackStatCard
          label="Avg HRV"
          icon="heart-sdnn"
          iconColor={colors.primary.blue500}
          value={sdnnValue}
          unit="ms"
          max={80}
          lowBound={20}
          highBound={45}
          info={SDNN_INFO}
          locked={locked}
          onPressLocked={onPressUpgrade}
          lastMeasuredLabel={lastMeasuredLabel}
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
});
