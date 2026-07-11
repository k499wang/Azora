import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing, padding } from '../../theme/spacing';
import {
  getStressZone,
  type StressHistoryEntry,
} from '../../lib/heartRate/stress';
import SectionHeader from '../common/SectionHeader';
import ProUpgradeButton from '../common/ProUpgradeButton';
import FeatureInfoDialog from '../common/FeatureInfoDialog';
import StressGauge from '../heartRate/StressGauge';
import { DEFAULT_CARD_SURFACE } from '../common/cardSurfaceConfig';

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
  lastMeasuredLabel?: string;
}

export default function RecoveryStatsSection({
  stress,
  stressHistory,
  locked = false,
  onPressUpgrade,
  lastMeasuredLabel,
}: RecoverySectionProps) {
  const stressValue = stress ?? (locked ? 38 : null);
  const [infoVisible, setInfoVisible] = useState(false);

  return (
    <View style={styles.section}>
      <View style={styles.headerWrap}>
        <SectionHeader
          title="Recovery"
          right={locked ? <ProUpgradeButton onPress={onPressUpgrade} /> : null}
        />
      </View>

      <View style={styles.gaugeWrap}>
        <View style={styles.stressGaugeWrap}>
          {!locked ? (
            <Pressable
              hitSlop={12}
              onPress={() => setInfoVisible(true)}
              style={styles.stressInfoButton}
            >
              <MaterialCommunityIcons
                name="information-outline"
                size={16}
                color={colors.text.tertiary}
              />
            </Pressable>
          ) : null}
          <StressGauge
            value={stressValue}
            zone={stressValue == null ? null : getStressZone(stressValue)}
            locked={locked}
            onPressLocked={onPressUpgrade}
            surface={DEFAULT_CARD_SURFACE}
            lastMeasuredLabel={lastMeasuredLabel}
          />
        </View>
      </View>

      <FeatureInfoDialog
        visible={infoVisible}
        onClose={() => setInfoVisible(false)}
        title={STRESS_INFO.title}
        intro={STRESS_INFO.message}
      />
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
