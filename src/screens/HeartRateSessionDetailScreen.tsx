import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography, fonts } from '../theme/typography';
import type { DataPoint } from '../components/analytics/LineGraph';
import { HeartRateResultContent } from '../components/heartRate/HeartRateResultContent';
import { useAuthStore } from '../stores/authStore';
import { useHeartRateSessionDetailQuery } from '../queries/tracking/useHeartRateSessionDetailQuery';
import type { HeartRateSessionDetailScreenProps } from '../app/navigation';

function formatLoggedAt(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function fmt(offsetMs: number): string {
  return `${Math.round(offsetMs / 1000)}s`;
}

function downsample<T>(
  samples: T[],
  toDataPoint: (sample: T) => DataPoint,
  maxPoints = 24,
): DataPoint[] {
  if (samples.length === 0) return [];
  if (samples.length <= maxPoints) return samples.map(toDataPoint);

  const step = (samples.length - 1) / (maxPoints - 1);
  const out: DataPoint[] = [];
  for (let i = 0; i < maxPoints; i++) {
    out.push(toDataPoint(samples[Math.round(i * step)]));
  }
  return out;
}

export function HeartRateSessionDetailScreen({
  navigation,
  route,
}: HeartRateSessionDetailScreenProps) {
  const user = useAuthStore((state) => state.user);
  const sessionId = route.params.sessionId;
  const detailQuery = useHeartRateSessionDetailQuery(user?.id ?? null, sessionId);
  const detail = detailQuery.data ?? null;

  const bpmSeries = detail == null
    ? []
    : downsample(detail.bpmSeries, (sample) => ({
      label: fmt(sample.offsetMs),
      value: sample.bpm,
    }));
  const rrSeries = detail == null
    ? []
    : downsample(detail.ibiSeries, (sample) => ({
      label: fmt(sample.offsetMs),
      value: Math.round(sample.ibiMs),
    }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={16}
            accessibilityLabel="Go back"
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="chevron-left" size={30} color={colors.text.primary} />
          </Pressable>
          <Text style={styles.topTitle}>Heart Rate</Text>
          <View style={styles.backButton} />
        </View>

        {detailQuery.isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.primary.blue600} />
          </View>
        ) : detailQuery.isError || detail == null ? (
          <View style={styles.centerState}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={42}
              color={colors.warning[500]}
            />
            <Text style={styles.errorTitle}>Could not load reading</Text>
            <Text style={styles.errorText}>This heart-rate session may no longer be available.</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <HeartRateResultContent
              bpm={detail.avgBpm ?? '--'}
              sampleCount={detail.bpmSeries.length || null}
              rmssd={detail.rmssd}
              hrDrop={detail.hrDrop}
              stress={detail.stress}
              bpmSeries={bpmSeries}
              rrSeries={rrSeries}
              metaText={formatLoggedAt(detail.startedAt)}
              showConfidence={false}
            />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  container: {
    flex: 1,
  },
  topBar: {
    height: 56,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    ...typography.heading.heading1,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['5xl'],
    alignItems: 'center',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  errorTitle: {
    ...typography.heading.heading1,
    color: colors.text.primary,
    textAlign: 'center',
  },
  errorText: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
