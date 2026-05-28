import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography, fonts } from '../../theme/typography';
import { card } from '../../theme/card';
import RingStatCard from './RingStatCard';
import LungWaterBackground from './LungWaterBackground';

const LUNG_SCORE_INFO = {
  title: 'Lung Score',
  message:
    'A 0–100 daily lung score based on today\'s Daily Exercise breath hold duration and heart-rate response during the hold.\n\nThis is a heuristic estimate, not a clinical health score.',
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
  bestHoldSeconds?: number | null;
  lungAge?: number | null;
  lungAgeTier?: string | null;
}

function formatHold(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) return '--';
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function scoreFromLungAge(lungAge: number | null | undefined): number | null {
  if (lungAge == null) return null;
  const score = ((LUNG_AGE_MAX - lungAge) / (LUNG_AGE_MAX - LUNG_AGE_MIN)) * 100;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function LungAgeRing({
  lungAge,
  lungAgeTier,
  holdSeconds,
  bestHoldSeconds,
}: {
  lungAge: number | null | undefined;
  lungAgeTier: string | null | undefined;
  holdSeconds: number | null | undefined;
  bestHoldSeconds: number | null | undefined;
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

  const tierLabel =
    lungAgeTier == null
      ? ''
      : lungAgeTier.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const fillLevel =
    holdSeconds == null || bestHoldSeconds == null || bestHoldSeconds <= 0
      ? 0.35
      : Math.max(0.15, Math.min(0.85, holdSeconds / bestHoldSeconds));

  return (
    <View style={styles.lungCard}>
      <LungWaterBackground fillLevel={fillLevel} />
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
              color={colors.primary.blue600}
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
  lungAge,
  lungAgeTier,
  bestHoldSeconds,
}: TodayInsightsProps) {
  const bpmValue = avgBpm == null ? '--' : `${Math.round(avgBpm)}`;
  const holdValue = formatHold(holdSeconds);
  const lungScore = scoreFromLungAge(lungAge);
  const lungScoreValue = lungScore == null ? '--' : `${lungScore}`;

  return (
    <View style={styles.page}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.smallRingsRow}>
        <RingStatCard
          label="BPM"
          value={bpmValue}
          progress={avgBpm == null ? 0 : avgBpm / 130}
          color={colors.error[700]}
          trackColor={colors.neutral[200]}
          icon="stat-heart-pulse"
        />
        <RingStatCard
          label="Hold"
          value={holdValue}
          progress={holdSeconds == null ? 0 : holdSeconds / 120}
          color={colors.primary.blue700}
          trackColor={colors.neutral[200]}
          icon="stat-breath-flow"
        />
        <RingStatCard
          label="Lungs"
          value={lungScoreValue}
          target="100"
          progress={lungScore == null ? 0 : lungScore / 100}
          color={colors.orange[700]}
          trackColor={colors.neutral[200]}
          icon="stat-lungs"
          info={LUNG_SCORE_INFO}
        />
      </View>

      <LungAgeRing
        lungAge={lungAge}
        lungAgeTier={lungAgeTier}
        holdSeconds={holdSeconds}
        bestHoldSeconds={bestHoldSeconds}
      />
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
