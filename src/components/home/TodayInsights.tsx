import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography, fonts } from '../../theme/typography';
import LungWaterBackground from './LungWaterBackground';
import CardSurface from '../common/CardSurface';
import FeatureInfoDialog from '../common/FeatureInfoDialog';

const AZORA_SCORE_INFO = {
  title: 'Azora Score',
  message:
    'A 0–100 score from today\'s breath hold, based on hold duration, average heart rate, and the diving-reflex bradycardia (HR drop during the hold).\n\nThis is a heuristic, not a medical metric. Higher scores reflect stronger breath control and autonomic function.',
};

const LUNG_RING_SIZE = 200;
const LUNG_RING_STROKE = 14;
const LUNG_RING_INSET = 14;
const LUNG_ARC_START = -90;
const LUNG_ARC_SWEEP = 360;

interface TodayInsightsProps {
  title?: string;
  holdSeconds?: number | null;
  bestHoldSeconds?: number | null;
  azoraScore?: number | null;
  azoraTier?: string | null;
}


function AzoraScoreRing({
  azoraScore,
  azoraTier,
  holdSeconds,
  bestHoldSeconds,
}: {
  azoraScore: number | null | undefined;
  azoraTier: string | null | undefined;
  holdSeconds: number | null | undefined;
  bestHoldSeconds: number | null | undefined;
}) {
  const [infoVisible, setInfoVisible] = useState(false);
  const cx = LUNG_RING_SIZE / 2;
  const cy = LUNG_RING_SIZE / 2;
  const r = LUNG_RING_SIZE / 2 - LUNG_RING_INSET - LUNG_RING_STROKE / 2;
  const rect = Skia.XYWHRect(cx - r, cy - r, r * 2, r * 2);

  const progress =
    azoraScore == null ? 0 : Math.max(0, Math.min(1, azoraScore / 100));

  const track = Skia.Path.Make();
  track.addCircle(cx, cy, r);

  const arc = Skia.Path.Make();
  if (progress >= 0.999) {
    arc.addCircle(cx, cy, r);
  } else if (progress > 0) {
    arc.addArc(rect, LUNG_ARC_START, LUNG_ARC_SWEEP * progress);
  }

  const tierLabel =
    azoraTier == null
      ? ''
      : azoraTier.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const fillLevel =
    holdSeconds == null || bestHoldSeconds == null || bestHoldSeconds <= 0
      ? 0.35
      : Math.max(0.15, Math.min(0.85, holdSeconds / bestHoldSeconds));

  return (
    <CardSurface style={styles.lungCard}>
      <LungWaterBackground fillLevel={fillLevel} />
      <Pressable
        hitSlop={12}
        onPress={() => setInfoVisible(true)}
        style={styles.infoButton}
      >
        <MaterialCommunityIcons
          name="information-outline"
          size={16}
          color={colors.text.tertiary}
        />
      </Pressable>
      <FeatureInfoDialog
        visible={infoVisible}
        onClose={() => setInfoVisible(false)}
        title={AZORA_SCORE_INFO.title}
        intro={AZORA_SCORE_INFO.message}
      />

      <View style={styles.lungRingWrap}>
        <Canvas style={{ width: LUNG_RING_SIZE, height: LUNG_RING_SIZE }}>
          <Path
            path={track}
            style="stroke"
            strokeWidth={LUNG_RING_STROKE}
            strokeCap="round"
            color={colors.primary.blue100}
          />
          {progress > 0 && (
            <Path
              path={arc}
              style="stroke"
              strokeWidth={LUNG_RING_STROKE + 0.5}
              strokeCap="round"
              color={colors.primary.blue500}
            />
          )}
        </Canvas>
        <View style={styles.lungCenter} pointerEvents="none">
          <Text style={styles.lungValue}>{azoraScore == null ? '--' : azoraScore}</Text>
          <Text style={styles.lungUnit}>/ 100</Text>
        </View>
      </View>

      <Text style={styles.lungLabel}>Azora score</Text>
      {tierLabel ? (
        <View style={styles.lungTierPill}>
          <Text style={styles.lungTierText}>{tierLabel}</Text>
        </View>
      ) : null}
    </CardSurface>
  );
}

export default function TodayInsights({
  title = 'Today\'s insights',
  holdSeconds,
  azoraScore,
  azoraTier,
  bestHoldSeconds,
}: TodayInsightsProps) {
  return (
    <View style={styles.page}>
      <Text style={styles.title}>{title}</Text>

      <AzoraScoreRing
        azoraScore={azoraScore}
        azoraTier={azoraTier}
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
  lungCard: {
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
    fontFamily: fonts.medium,
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
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
    ...typography.label.small,
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.text.tertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: spacing.sm,
  },
  lungTierPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 20,
    backgroundColor: `${colors.primary.blue500}18`,
    marginTop: spacing.xs,
  },
  lungTierText: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.primary.blue500,
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
