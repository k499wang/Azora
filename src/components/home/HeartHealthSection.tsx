import { useState } from 'react';
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, padding } from '../../theme/spacing';
import { typography, fonts } from '../../theme/typography';
import SectionHeader from '../common/SectionHeader';
import HRVTrackStatCard from './HRVTrackStatCard';
import ProLockedOverlay from './ProLockedOverlay';
import HRVChart from './HRVChart';
import BPMChart from './BPMChart';

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
        <SectionHeader title="Heart health" />
      </View>

      <ProLockedOverlay
        locked={locked}
        onPressUpgrade={onPressUpgrade}
        subtext="Advanced HRV metrics are part of Azora Pro."
      >
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
                    <HRVChart ibiMs={ibiMs} color={colors.error[500]} />
                  </View>
                  <View style={{ width: pagerWidth }}>
                    <BPMChart ibiMs={ibiMs} color={colors.primary.blue500} />
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
  metricColumn: {
    flexDirection: 'column',
    gap: spacing.sm,
    paddingHorizontal: padding.screen.horizontal,
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
