import { useState } from 'react';
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '../../theme/colors';
import { spacing, padding } from '../../theme/spacing';
import { typography, fonts } from '../../theme/typography';
import { card } from '../../theme/card';
import SectionHeader from '../common/SectionHeader';
import ProUpgradeButton from '../common/ProUpgradeButton';
import HRVTrackStatCard from './HRVTrackStatCard';
import HRVChart from './HRVChart';
import BPMChart from './BPMChart';

function ThermometerStatCard({
  label,
  value,
  unit,
  min,
  max,
  accent,
  locked = false,
  onPressLocked,
}: {
  label: string;
  value: number | null | undefined;
  unit: string;
  min: number;
  max: number;
  accent: string;
  locked?: boolean;
  onPressLocked?: () => void;
}) {
  const hasValue = value != null && Number.isFinite(value);
  const magnitude = hasValue ? Math.abs(value!) : null;
  const clamped = magnitude != null ? Math.max(min, Math.min(max, magnitude)) : null;
  const fillPct = clamped != null ? ((clamped - min) / (max - min)) * 100 : 0;

  return (
    <View style={[styles.tile, locked && styles.lockedTile]}>
      <Text style={styles.tileLabel}>{label}</Text>
      <View style={styles.tileContent}>
        <View style={styles.tileBody}>
          <View style={styles.tileValueRow}>
            <Text style={styles.tileValue}>
              {magnitude != null ? Math.round(magnitude) : '--'}
            </Text>
            <Text style={styles.tileUnit}>{unit}</Text>
          </View>
        </View>
        <View style={styles.thermoTrack}>
          <View
            style={[
              styles.thermoFill,
              { height: `${fillPct}%`, backgroundColor: accent },
            ]}
          />
        </View>
      </View>
      {locked ? (
        <>
          <BlurView
            intensity={24}
            tint="light"
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
          />
          <Text style={[styles.tileLabel, styles.clearTileLabel]}>
            {label}
          </Text>
          {onPressLocked ? (
            <Pressable
              accessibilityRole="button"
              onPress={onPressLocked}
              style={StyleSheet.absoluteFill}
            />
          ) : null}
        </>
      ) : null}
    </View>
  );
}

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
  hrDrop?: number | null;
  minBpm?: number | null;
  ibiMs?: number[];
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
  hrDrop,
  minBpm,
  ibiMs = [],
  locked = false,
  onPressUpgrade,
}: HeartHealthSectionProps) {
  const rmssdValue = rmssd ?? (locked ? 48 : null);
  const sdnnValue = sdnn ?? (locked ? 42 : null);
  const avgRmssdValue = avgRmssd ?? (locked ? 46 : null);
  const avgSdnnValue = avgSdnn ?? (locked ? 40 : null);
  const maxRmssdValue = maxRmssd ?? (locked ? 62 : null);
  const maxSdnnValue = maxSdnn ?? (locked ? 55 : null);

  const [pagerWidth, setPagerWidth] = useState(0);
  const [page, setPage] = useState(0);

  const onPagerLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w !== pagerWidth) setPagerWidth(w);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (pagerWidth <= 0) return;
    const next = Math.round(e.nativeEvent.contentOffset.x / pagerWidth);
    if (next !== page) setPage(next);
  };

  return (
    <View style={styles.section}>
      <View style={styles.headerWrap}>
        <SectionHeader
          title="Heart health"
          right={locked ? <ProUpgradeButton onPress={onPressUpgrade} /> : null}
        />
      </View>

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
            locked={locked}
            onPressLocked={onPressUpgrade}
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
            locked={locked}
            onPressLocked={onPressUpgrade}
          />

          <View onLayout={onPagerLayout}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onScroll}
              scrollEventThrottle={16}
              decelerationRate="fast"
            >
              {pagerWidth > 0 ? (
                <>
                  <View style={{ width: pagerWidth }}>
                    <HRVChart
                      ibiMs={ibiMs}
                      color={colors.error[500]}
                      locked={locked}
                      onPressLocked={onPressUpgrade}
                    />
                  </View>
                  <View style={{ width: pagerWidth }}>
                    <BPMChart
                      ibiMs={ibiMs}
                      color={colors.primary.blue500}
                      locked={locked}
                      onPressLocked={onPressUpgrade}
                    />
                  </View>
                </>
              ) : null}
            </ScrollView>

            <Text style={styles.swipeHint}>
              {page === 0 ? 'Swipe for heart rate →' : '← Swipe for HRV'}
            </Text>

            <View style={styles.dots}>
              {[0, 1].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === page ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.tileRow}>
            <ThermometerStatCard
              label="HR drop"
              value={hrDrop ?? (locked ? 18 : null)}
              unit="bpm"
              min={0}
              max={40}
              accent={colors.primary.blue500}
              locked={locked}
              onPressLocked={onPressUpgrade}
            />
            <ThermometerStatCard
              label="Lowest HR"
              value={minBpm ?? (locked ? 54 : null)}
              unit="bpm"
              min={40}
              max={90}
              accent={colors.error[500]}
              locked={locked}
              onPressLocked={onPressUpgrade}
            />
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
  metricColumn: {
    flexDirection: 'column',
    gap: spacing.sm,
    paddingHorizontal: padding.screen.horizontal,
  },
  tileRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tile: {
    ...card.base,
    ...card.shadow,
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  lockedTile: {
    overflow: 'hidden',
  },
  clearTileLabel: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    zIndex: 2,
  },
  tileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: 16,
  },
  tileBody: {
    flex: 1,
    justifyContent: 'center',
  },
  tileLabel: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
  },
  tileValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  tileValue: {
    fontSize: 28,
    lineHeight: 32,
    fontFamily: fonts.medium,
    fontWeight: '500',
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  tileUnit: {
    ...typography.label.small,
    fontSize: 12,
    color: colors.text.tertiary,
    fontFamily: fonts.semibold,
  },
  thermoTrack: {
    width: 10,
    height: 80,
    borderRadius: 5,
    backgroundColor: colors.neutral[100],
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  thermoFill: {
    width: '100%',
    borderRadius: 5,
  },
  swipeHint: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontFamily: fonts.semibold,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: colors.text.primary,
  },
  dotInactive: {
    backgroundColor: colors.neutral[300],
  },
});
