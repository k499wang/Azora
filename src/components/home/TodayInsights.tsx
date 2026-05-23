import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography, fonts } from '../../theme/typography';
import { card } from '../../theme/card';
import RingStatCard from './RingStatCard';

const HEALTH_INFO = {
  title: 'Health Score',
  message:
    'A 0–100 composite score based on heart rate, HRV, breath hold, and recovery during the session. A higher score indicates better overall cardiorespiratory health.\n\n70+ is considered strong; 85+ is excellent.',
};

const LUNG_AGE_INFO = {
  title: 'Lung Age',
  message:
    'An estimated cardio-respiratory age based on today\'s breath hold duration, average heart rate, and the diving-reflex bradycardia (HR drop during the hold).\n\nThis is a heuristic estimate, not a clinical lung age. Younger estimates reflect stronger breath control and autonomic function.',
};

const LUNG_AGE_MIN = 18;
const LUNG_AGE_MAX = 80;
const LUNG_RING_SIZE = 200;
const LUNG_RING_STROKE = 14;
const LUNG_RING_INSET = 14;
const LUNG_ARC_START = 135;
const LUNG_ARC_SWEEP = 270;

interface TodayInsightsProps {
  title?: string;
  avgBpm?: number | null;
  holdSeconds?: number | null;
  healthScore?: number | null;
  lungAge?: number | null;
  lungAgeTier?: string | null;
}

function formatHold(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) return '--';
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function LungAgeRing({
  lungAge,
  lungAgeTier,
}: {
  lungAge: number | null | undefined;
  lungAgeTier: string | null | undefined;
}) {
  const cx = LUNG_RING_SIZE / 2;
  const cy = LUNG_RING_SIZE / 2;
  const r = LUNG_RING_SIZE / 2 - LUNG_RING_INSET - LUNG_RING_STROKE / 2;
  const rect = Skia.XYWHRect(cx - r, cy - r, r * 2, r * 2);

  const progress =
    lungAge == null
      ? 0
      : Math.max(
          0,
          Math.min(
            1,
            (LUNG_AGE_MAX - lungAge) / (LUNG_AGE_MAX - LUNG_AGE_MIN),
          ),
        );

  const track = Skia.Path.Make();
  track.addArc(rect, LUNG_ARC_START, LUNG_ARC_SWEEP);

  const arc = Skia.Path.Make();
  arc.addArc(rect, LUNG_ARC_START, LUNG_ARC_SWEEP * progress);

  const arcColor =
    progress >= 0.66
      ? colors.success[500]
      : progress >= 0.33
        ? colors.orange[500]
        : colors.error[500];

  const tierLabel =
    lungAgeTier == null
      ? ''
      : lungAgeTier.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <View style={styles.lungCard}>
      <Pressable
        hitSlop={12}
        onPress={() => Alert.alert(LUNG_AGE_INFO.title, LUNG_AGE_INFO.message)}
        style={styles.infoButton}
      >
        <MaterialCommunityIcons
          name="information-outline"
          size={16}
          color={colors.text.tertiary}
        />
      </Pressable>

      <View style={styles.lungRingWrap}>
        <Canvas style={{ width: LUNG_RING_SIZE, height: LUNG_RING_SIZE }}>
          <Path
            path={track}
            style="stroke"
            strokeWidth={LUNG_RING_STROKE}
            strokeCap="round"
            color={colors.neutral[200]}
          />
          {progress > 0 && (
            <Path
              path={arc}
              style="stroke"
              strokeWidth={LUNG_RING_STROKE}
              strokeCap="round"
              color={arcColor}
            />
          )}
        </Canvas>
        <View style={styles.lungCenter} pointerEvents="none">
          <Text style={styles.lungValue}>{lungAge == null ? '--' : lungAge}</Text>
          <Text style={styles.lungUnit}>years</Text>
        </View>
      </View>

      <Text style={styles.lungLabel}>Lung age</Text>
      {tierLabel ? <Text style={styles.lungTier}>{tierLabel}</Text> : null}
    </View>
  );
}

export default function TodayInsights({
  title = 'Today\'s insights',
  avgBpm,
  holdSeconds,
  healthScore,
  lungAge,
  lungAgeTier,
}: TodayInsightsProps) {
  const bpmValue = avgBpm == null ? '--' : `${Math.round(avgBpm)}`;
  const holdValue = formatHold(holdSeconds);
  const healthValue = healthScore == null ? '--' : `${Math.round(healthScore)}`;

  return (
    <View style={styles.page}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.smallRingsRow}>
        <RingStatCard
          label="BPM"
          value={bpmValue}
          progress={avgBpm == null ? 0 : avgBpm / 130}
          color={colors.error[700]}
          gradientTo={colors.error[100]}
          trackColor={colors.neutral[200]}
          icon="stat-heart-pulse"
        />
        <RingStatCard
          label="Hold"
          value={holdValue}
          progress={holdSeconds == null ? 0 : holdSeconds / 120}
          color={colors.primary.blue700}
          gradientTo={colors.primary.blue300}
          trackColor={colors.neutral[200]}
          icon="stat-breath-flow"
        />
        <RingStatCard
          label="Health"
          value={healthValue}
          target="100"
          progress={healthScore == null ? 0 : healthScore / 100}
          color={colors.orange[700]}
          gradientTo={colors.orange[200]}
          trackColor={colors.neutral[200]}
          icon="stat-health-spark"
          info={HEALTH_INFO}
        />
      </View>

      <LungAgeRing lungAge={lungAge} lungAgeTier={lungAgeTier} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.md,
  },
  title: {
    ...typography.title.title3,
    color: colors.text.primary,
  },
  smallRingsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  lungCard: {
    ...card.base,
    ...card.shadow,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  lungRingWrap: {
    width: LUNG_RING_SIZE,
    height: LUNG_RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lungCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lungValue: {
    fontSize: 56,
    lineHeight: 60,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    letterSpacing: -1.5,
  },
  lungUnit: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  lungLabel: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  lungTier: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  infoButton: {
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
