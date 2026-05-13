import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, padding } from '../../theme/spacing';
import SectionHeader from '../common/SectionHeader';
import BigRingStatCard from './BigRingStatCard';
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
  locked?: boolean;
  onPressUpgrade?: () => void;
}

export default function HeartHealthSection({
  rmssd,
  sdnn,
  locked = false,
  onPressUpgrade,
}: HeartHealthSectionProps) {
  const rmssdValue = rmssd ?? (locked ? 48 : null);
  const sdnnValue = sdnn ?? (locked ? 42 : null);

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
        <View style={styles.metricRow}>
          <BigRingStatCard
            label="RMSSD"
            value={rmssdValue == null ? '--' : `${rmssdValue}`}
            progress={rmssdValue == null ? 0.72 : rmssdValue / 60}
            color={colors.primary.blue700}
            trackColor={colors.neutral[200]}
            icon="stat-rmssd-wave"
            info={RMSSD_INFO}
          />
          <BigRingStatCard
            label="Avg HRV"
            value={sdnnValue == null ? '--' : `${sdnnValue}`}
            progress={sdnnValue == null ? 0.62 : sdnnValue / 50}
            color={colors.orange[700]}
            trackColor={colors.neutral[200]}
            icon="stat-hrv-curve"
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
  metricRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: padding.screen.horizontal,
  },
});
