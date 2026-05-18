import { StyleSheet, View } from 'react-native';
import { spacing, padding } from '../../theme/spacing';
import SectionHeader from '../common/SectionHeader';
import HRVTrackStatCard from './HRVTrackStatCard';
import ProLockedOverlay from './ProLockedOverlay';

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
interface HeartHealthSectionProps {
  rmssd?: number | null;
  sdnn?: number | null;
  avgRmssd?: number | null;
  avgSdnn?: number | null;
  maxRmssd?: number | null;
  maxSdnn?: number | null;
  locked?: boolean;
  onPressUpgrade?: () => void;
}

export default function HeartHealthSection({
  rmssd,
  sdnn,
  avgRmssd,
  avgSdnn,
  maxRmssd,
  maxSdnn,
  locked = false,
  onPressUpgrade,
}: HeartHealthSectionProps) {
  const rmssdValue = rmssd ?? (locked ? 48 : null);
  const sdnnValue = sdnn ?? (locked ? 42 : null);
  const avgRmssdValue = avgRmssd ?? (locked ? 46 : null);
  const avgSdnnValue = avgSdnn ?? (locked ? 40 : null);
  const maxRmssdValue = maxRmssd ?? (locked ? 62 : null);
  const maxSdnnValue = maxSdnn ?? (locked ? 55 : null);

  return (
    <View style={styles.section}>
      <View style={styles.headerWrap}>
        <SectionHeader title="Heart health" />
      </View>

      <ProLockedOverlay
        locked={locked}
        onPressUpgrade={onPressUpgrade}
        subtext="Advanced HRV metrics are part of Azora Pro."
      >
        <View style={styles.metricColumn}>
          <HRVTrackStatCard
            label="RMSSD"
            value={rmssdValue}
            avgValue={avgRmssdValue}
            bestValue={maxRmssdValue}
            unit="ms"
            max={80}
            lowBound={20}
            highBound={50}
            info={RMSSD_INFO}
          />
          <HRVTrackStatCard
            label="Avg HRV"
            value={sdnnValue}
            avgValue={avgSdnnValue}
            bestValue={maxSdnnValue}
            unit="ms"
            max={80}
            lowBound={20}
            highBound={45}
            info={SDNN_INFO}
          />
        </View>
      </ProLockedOverlay>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.xl,
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
