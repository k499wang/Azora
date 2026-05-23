import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing, padding } from '../../theme/spacing';
import {
  getStressZone,
  type StressHistoryEntry,
} from '../../lib/heartRate/stress';
import SectionHeader from '../common/SectionHeader';
import StressGauge from '../heartRate/StressGauge';
import ProLockedOverlay from './ProLockedOverlay';

const STRESS_INFO = {
  title: 'Stress Score',
  message:
    'A 0–100 estimate of physiological stress derived from your HRV. Lower numbers reflect a calmer, more recovered state.\n\n0–30: relaxed. 30–60: balanced. 60–100: elevated stress or fatigue.',
};

interface RecoverySectionProps {
  stress?: number | null;
  stressHistory?: StressHistoryEntry[];
  locked?: boolean;
  onPressUpgrade?: () => void;
}

export default function RecoverySection({
  stress,
  stressHistory,
  locked = false,
  onPressUpgrade,
}: RecoverySectionProps) {
  const stressValue = stress ?? (locked ? 38 : null);

  return (
    <View style={styles.section}>
      <View style={styles.headerWrap}>
        <SectionHeader title="Recovery" />
      </View>

      <ProLockedOverlay locked={locked} onPressUpgrade={onPressUpgrade}>
        <View style={styles.gaugeWrap}>
          <View style={styles.stressGaugeWrap}>
            <Pressable
              hitSlop={12}
              disabled={locked}
              onPress={() => Alert.alert(STRESS_INFO.title, STRESS_INFO.message)}
              style={styles.stressInfoButton}
            >
              <MaterialCommunityIcons
                name="information-outline"
                size={16}
                color={colors.text.tertiary}
              />
            </Pressable>
            <StressGauge
              value={stressValue}
              zone={stressValue == null ? null : getStressZone(stressValue)}
              history={locked ? undefined : stressHistory}
            />
          </View>
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
  gaugeWrap: {
    paddingHorizontal: padding.screen.horizontal,
  },
  stressGaugeWrap: {
    position: 'relative',
  },
  stressInfoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
});
