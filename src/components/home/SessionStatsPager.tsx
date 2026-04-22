import { useMemo, useState } from 'react';
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import RingStatCard from './RingStatCard';
import BigRingStatCard from './BigRingStatCard';
import HRVChart from './HRVChart';
import ThinPPGChart from './ThinPPGChart';
import { computeHRVStats } from '../../lib/hrv';

interface SessionStatsPagerProps {
  ibiMs?: number[];
}

const DEFAULT_IBI_MS: number[] = [
  790, 812, 835, 818, 802, 845, 870, 858, 832, 880,
  905, 892, 915, 940, 928, 952, 975, 962, 985, 1010,
  998, 1025, 1048, 1032, 1018, 1045, 1062,
];

export default function SessionStatsPager({ ibiMs = DEFAULT_IBI_MS }: SessionStatsPagerProps) {
  const [pageWidth, setPageWidth] = useState(0);
  const [page, setPage] = useState(0);

  const stats = useMemo(() => computeHRVStats(ibiMs), [ibiMs]);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w !== pageWidth) setPageWidth(w);
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (pageWidth <= 0) return;
    const next = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    if (next !== page) setPage(next);
  };

  const pages = [
    {
      key: 'vitals',
      content: (
        <>
          <View style={styles.smallRingsRow}>
            <RingStatCard
              label="BPM"
              value="62"
              target="60"
              progress={0.48}
              color={colors.error[500]}
              trackColor={colors.neutral[200]}
              icon="heart-pulse"
            />
            <RingStatCard
              label="Hold"
              value="1:42"
              target="2:00"
              progress={0.72}
              color={colors.primary.blue500}
              trackColor={colors.neutral[200]}
              icon="timer-sand"
            />
            <RingStatCard
              label="Health"
              value="92"
              target="100"
              progress={0.92}
              color={colors.success[500]}
              trackColor={colors.neutral[200]}
              icon="heart-plus"
            />
          </View>
          <HRVChart ibiMs={ibiMs} color={colors.error[500]} />
        </>
      ),
    },
    {
      key: 'hrv',
      content: (
        <>
          <View style={styles.bigRingsRow}>
            <BigRingStatCard
              label="RMSSD"
              value={`${stats.rmssd}`}
              target="60"
              progress={stats.rmssd / 60}
              color={colors.primary.blue500}
              trackColor={colors.neutral[200]}
              icon="pulse"
            />
            <BigRingStatCard
              label="SDNN"
              value={`${stats.sdnn}`}
              target="50"
              progress={stats.sdnn / 50}
              color={colors.success[500]}
              trackColor={colors.neutral[200]}
              icon="chart-bell-curve"
            />
          </View>
          <ThinPPGChart
            title="PPG waveform"
            data={ibiMs}
            durationSec={stats.durationSec}
            color={colors.primary.blue500}
          />
        </>
      ),
    },
  ];

  return (
    <View onLayout={onLayout}>
      {pageWidth > 0 ? (
        <>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScrollEnd}
          >
            {pages.map((p) => (
              <View key={p.key} style={[styles.page, { width: pageWidth }]}>
                {p.content}
              </View>
            ))}
          </ScrollView>
          <View style={styles.dotsRow}>
            {pages.map((p, i) => (
              <View key={p.key} style={[styles.dot, i === page && styles.dotActive]} />
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.md,
  },
  smallRingsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bigRingsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.neutral[300],
  },
  dotActive: {
    backgroundColor: colors.text.primary,
    width: 18,
  },
});
