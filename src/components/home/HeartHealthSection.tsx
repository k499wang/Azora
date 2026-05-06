import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, padding } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { card } from '../../theme/card';
import SectionHeader from '../common/SectionHeader';
import BigRingStatCard from './BigRingStatCard';
import StressGauge from '../heartRate/StressGauge';
import { getStressZone } from '../../lib/heartRate/stress';

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
  const rmssdValue = rmssd ?? null;
  const sdnnValue = sdnn ?? null;
  const stressValue = stress ?? null;
  const hrDropValue = hrDrop ?? null;
  const insight = buildInsight(rmssdValue, sdnnValue, hrDropValue);

  return (
    <View style={styles.section}>
      <View style={styles.headerWrap}>
        <SectionHeader title="Heart health" />
      </View>

      <Pressable
        disabled={!locked || onPressUpgrade == null}
        onPress={onPressUpgrade}
        style={({ pressed }) => [
          styles.contentWrap,
          locked && styles.lockedWrap,
          pressed && styles.lockedPressed,
        ]}
      >
        {locked ? (
          <View style={styles.lockedBadge}>
            <Text style={styles.lockedBadgeText}>PRO</Text>
          </View>
        ) : null}

        <View style={[styles.metricRow, locked && styles.lockedContent]}>
          <BigRingStatCard
            label="RMSSD"
            value={locked ? 'Pro' : rmssdValue == null ? '--' : `${rmssdValue}`}
            target="60"
            progress={locked || rmssdValue == null ? 0.72 : rmssdValue / 60}
            color={colors.primary.blue500}
            trackColor={colors.neutral[200]}
            icon="heart-rmssd"
          />
          <BigRingStatCard
            label="Avg HRV"
            value={locked ? 'Pro' : sdnnValue == null ? '--' : `${sdnnValue}`}
            target="50"
            progress={locked || sdnnValue == null ? 0.62 : sdnnValue / 50}
            color={colors.success[500]}
            trackColor={colors.neutral[200]}
            icon="heart-sdnn"
          />
        </View>

        <View style={[styles.gaugeWrap, locked && styles.lockedContent]}>
          {locked ? (
            <View style={styles.stressPlaceholder}>
              <Text style={styles.stressPlaceholderTitle}>Stress score is Pro</Text>
              <Text style={styles.stressPlaceholderText}>
                Unlock Azora Pro to see stress, HRV, and recovery patterns after each session.
              </Text>
            </View>
          ) : stressValue == null ? (
            <View style={styles.stressPlaceholder}>
              <Text style={styles.stressPlaceholderTitle}>No stress score yet</Text>
              <Text style={styles.stressPlaceholderText}>
                Complete a tracked session with valid HRV to see this day&apos;s stress gauge.
              </Text>
            </View>
          ) : (
            <StressGauge value={stressValue} zone={getStressZone(stressValue)} />
          )}
        </View>

        <View style={[styles.insightCard, locked && styles.lockedContent]}>
          <Text style={styles.insightEyebrow}>Insight</Text>
          <Text style={styles.insightTone}>
            {locked ? 'Unlock recovery insight' : insight.tone}
          </Text>
          <Text style={styles.insightDetail}>
            {locked
              ? 'Pro reveals what your HRV and stress data mean after each session.'
              : insight.detail}
          </Text>
        </View>
      </Pressable>
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
  },
  lockedPressed: {
    opacity: 0.85,
  },
  lockedContent: {
    opacity: 0.78,
  },
  lockedBadge: {
    position: 'absolute',
    top: -6,
    right: padding.screen.horizontal,
    zIndex: 5,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    backgroundColor: colors.neutral[900],
  },
  lockedBadgeText: {
    ...typography.caption.caption1,
    color: colors.text.inverse,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  gaugeWrap: {
    paddingHorizontal: padding.screen.horizontal,
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
