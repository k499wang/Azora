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
import { spacing } from '../../theme/spacing';
import { typography, fonts } from '../../theme/typography';
import RingStatCard from './RingStatCard';
import HRVChart from './HRVChart';
import BPMChart from './BPMChart';

const HEALTH_INFO = {
  title: 'Health Score',
  message:
    'A 0–100 composite score based on heart rate, HRV, breath hold, and recovery during the session. A higher score indicates better overall cardiorespiratory health.\n\n70+ is considered strong; 85+ is excellent.',
};

interface SessionStatsPagerProps {
  title?: string;
  avgBpm?: number | null;
  holdSeconds?: number | null;
  healthScore?: number | null;
  ibiMs?: number[];
}

function formatHold(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) return '--';
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export default function SessionStatsPager({
  title = 'Today\'s insights',
  avgBpm,
  holdSeconds,
  healthScore,
  ibiMs = [],
}: SessionStatsPagerProps) {
  const bpmValue = avgBpm == null ? '--' : `${Math.round(avgBpm)}`;
  const holdValue = formatHold(holdSeconds);
  const healthValue = healthScore == null ? '--' : `${Math.round(healthScore)}`;

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
