import type { ReactNode } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing, padding } from '../../theme/spacing';
import { typography, fonts } from '../../theme/typography';
import { card } from '../../theme/card';
import SectionHeader from '../common/SectionHeader';
import BigRingStatCard from './BigRingStatCard';
import StressGauge from '../heartRate/StressGauge';
import { getStressZone } from '../../lib/heartRate/stress';

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
const STRESS_INFO = {
  title: 'Stress Score',
  message:
    'A 0–100 estimate of physiological stress derived from your HRV. Lower numbers reflect a calmer, more recovered state.\n\n0–30: relaxed. 30–60: balanced. 60–100: elevated stress or fatigue.',
};

interface HeartHealthSectionProps {
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

export default function HeartHealthSection({
  rmssd,
  sdnn,
  stress,
  hrDrop,
  locked = false,
  onPressUpgrade,
}: HeartHealthSectionProps) {
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
        <SectionHeader title="Heart health" />
      </View>

      <LockedOverlay locked={locked} onPressUpgrade={onPressUpgrade}>
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
      </LockedOverlay>
    </View>
  );
}

interface LockedOverlayProps {
  locked: boolean;
  onPressUpgrade?: () => void;
  children: ReactNode;
}

function LockedOverlay({ locked, onPressUpgrade, children }: LockedOverlayProps) {
  if (!locked) {
    return <View style={styles.contentWrap}>{children}</View>;
  }
  return (
    <View style={styles.lockedWrap}>
      <View pointerEvents="none" style={styles.contentWrap}>
        {children}
      </View>
      <BlurView
        intensity={18}
        tint="light"
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <LinearGradient
        pointerEvents="none"
        colors={[
          'rgba(255,255,255,0)',
          'rgba(255,255,255,0.45)',
          'rgba(255,255,255,0.45)',
          'rgba(255,255,255,0)',
        ]}
        locations={[0, 0.25, 0.75, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.lockedCenter} pointerEvents="box-none">
        <Pressable
          disabled={onPressUpgrade == null}
          onPress={onPressUpgrade}
          style={({ pressed }) => [
            styles.lockedCta,
            pressed && styles.lockedCtaPressed,
          ]}
        >
          <MaterialCommunityIcons
            name="lock"
            size={18}
            color={colors.text.inverse}
          />
          <Text style={styles.lockedCtaText}>Get Pro to unlock</Text>
          <View style={styles.lockedBadge}>
            <Text style={styles.lockedBadgeText}>PRO</Text>
          </View>
        </Pressable>
        <View style={styles.lockedSubtextPill}>
          <Text style={styles.lockedSubtext}>
            HRV, stress, and recovery insights are part of Azora Pro.
          </Text>
        </View>
      </View>
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
  contentWrap: {
    gap: spacing.md,
  },
  lockedWrap: {
    position: 'relative',
    overflow: 'hidden',
  },
  lockedCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  lockedCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.neutral[900],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 999,
    ...card.shadow,
  },
  lockedCtaPressed: {
    opacity: 0.85,
  },
  lockedCtaText: {
    ...typography.label.medium,
    color: colors.text.inverse,
    fontFamily: fonts.semibold,
    fontWeight: '600',
  },
  lockedSubtext: {
    ...typography.caption.caption1,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    textAlign: 'center',
  },
  lockedSubtextPill: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    maxWidth: '92%',
    ...card.shadow,
  },
  lockedBadge: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.primary.blue500,
  },
  lockedBadgeText: {
    ...typography.caption.caption2,
    color: colors.text.inverse,
    fontFamily: fonts.semibold,
    fontWeight: '700',
    letterSpacing: 0.8,
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
