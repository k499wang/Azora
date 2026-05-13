import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing, padding } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { card } from '../../theme/card';
import { getStressZone } from '../../lib/heartRate/stress';
import SectionHeader from '../common/SectionHeader';
import StressGauge from '../heartRate/StressGauge';
import ProLockedOverlay from './ProLockedOverlay';

const STRESS_INFO = {
  title: 'Stress Score',
  message:
    'A 0–100 estimate of physiological stress derived from your HRV. Lower numbers reflect a calmer, more recovered state.\n\n0–30: relaxed. 30–60: balanced. 60–100: elevated stress or fatigue.',
};

interface RecoverySectionProps {
  rmssd?: number | null;
  sdnn?: number | null;
  stress?: number | null;
  hrDrop?: number | null;
  locked?: boolean;
  onPressUpgrade?: () => void;
}

function buildInsight(rmssd: number | null, sdnn: number | null, hrDrop: number | null): {
  tone: string;
  detail: string;
} {
  if (rmssd == null || sdnn == null) {
    return {
      tone: 'No HRV for this day',
      detail: 'Complete a breath hold with heart-rate tracking to unlock a recovery insight.',
    };
  }

  if (rmssd >= 55 && sdnn >= 45) {
    return {
      tone: 'Strong recovery',
      detail:
        hrDrop != null && hrDrop > 0
          ? `Your variability looks strong for this day and your heart rate settled by ${hrDrop} bpm during recovery.`
          : 'Your variability looks strong for this day, with a stable recovery pattern through the session.',
    };
  }

  if (rmssd >= 35 && sdnn >= 30) {
    return {
      tone: 'Balanced pattern',
      detail:
        hrDrop != null && hrDrop > 0
          ? `Your breath hold shows a steady recovery response, with heart rate easing down by ${hrDrop} bpm.`
          : 'Your variability sits in a balanced range for this day, though recovery looks more flat than usual.',
    };
  }

  return {
    tone: 'Recovery is muted',
    detail:
      hrDrop != null && hrDrop > 0
        ? `Variability is on the lower side for this day. A ${hrDrop} bpm drop still shows some recovery, but the signal suggests stress or fatigue.`
        : 'Variability is on the lower side for this day, which can happen when stress, fatigue, or inconsistent breathing is higher.',
  };
}

export default function RecoverySection({
  rmssd,
  sdnn,
  stress,
  hrDrop,
  locked = false,
  onPressUpgrade,
}: RecoverySectionProps) {
  const rmssdValue = rmssd ?? (locked ? 48 : null);
  const sdnnValue = sdnn ?? (locked ? 42 : null);
  const stressValue = stress ?? (locked ? 38 : null);
  const hrDropValue = hrDrop ?? (locked ? 9 : null);
  const insight = locked
    ? {
        tone: 'Strong recovery',
        detail:
          'Your variability looks strong for this day, with a stable recovery pattern through the session.',
      }
    : buildInsight(rmssdValue, sdnnValue, hrDropValue);

  return (
    <View style={styles.section}>
      <View style={styles.headerWrap}>
        <SectionHeader title="Recovery" />
      </View>

      <ProLockedOverlay locked={locked} onPressUpgrade={onPressUpgrade}>
        <View style={styles.gaugeWrap}>
          {stressValue == null ? (
            <View style={styles.stressPlaceholder}>
              <Text style={styles.stressPlaceholderTitle}>No stress score yet</Text>
              <Text style={styles.stressPlaceholderText}>
                Complete a tracked session with valid HRV to see this day&apos;s stress gauge.
              </Text>
            </View>
          ) : (
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
              <StressGauge value={stressValue} zone={getStressZone(stressValue)} />
            </View>
          )}
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightEyebrow}>Insight</Text>
          <Text style={styles.insightTone}>{insight.tone}</Text>
          <Text style={styles.insightDetail}>{insight.detail}</Text>
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
  stressPlaceholder: {
    ...card.base,
    ...card.shadow,
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  stressPlaceholderTitle: {
    ...typography.title.title3,
    color: colors.text.primary,
    textAlign: 'center',
  },
  stressPlaceholderText: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  insightCard: {
    ...card.base,
    ...card.shadow,
    marginHorizontal: padding.screen.horizontal,
    minHeight: 136,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  insightEyebrow: {
    ...typography.label.small,
    color: colors.primary.blue600,
  },
  insightTone: {
    ...typography.title.title3,
    color: colors.text.primary,
  },
  insightDetail: {
    ...typography.body.small,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});
