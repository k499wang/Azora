import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing, padding, margin } from '../theme/spacing';
import { typography, fonts } from '../theme/typography';
import type { DataPoint } from '../components/analytics/LineGraph';
import { HeartRateResultContent } from '../components/heartRate/HeartRateResultContent';
import { useAuthStore } from '../stores/authStore';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { useHeartRateSessionDetailQuery } from '../queries/tracking/useHeartRateSessionDetailQuery';
import { PaywallPlacement } from '../services/paywall';
import { FeatureKey } from '../services/subscriptions/featureAccess';
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
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const sessionId = route.params.sessionId;
  const detailQuery = useHeartRateSessionDetailQuery(user?.id ?? null, sessionId);
  const advancedStatsAccess = useFeatureAccess(FeatureKey.AdvancedStats);
  const detail = detailQuery.data ?? null;
  const advancedStatsLocked =
    !advancedStatsAccess.allowed && !advancedStatsAccess.isLoading;

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
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="close" size={22} color={colors.text.secondary} />
          </Pressable>
          <Text style={styles.headerTitle}>Nice work!</Text>
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
            <Text style={styles.errorText}>
              This heart-rate session may no longer be available.
            </Text>
          </View>
        ) : (
          <View style={styles.heroWrap}>
            <View style={styles.heroContent}>
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
                advancedStatsLocked={advancedStatsLocked}
                onPressUpgrade={() => {
                  navigation.navigate('ProPaywall', {
                    placement: PaywallPlacement.DailyResultProGate,
                    sourceScreen: 'HeartRateSessionDetail',
                    feature: FeatureKey.AdvancedStats,
                  });
                }}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    paddingBottom: spacing['5xl'],
  },
  header: {
    paddingHorizontal: padding.screen.horizontal,
    paddingTop: padding.screen.vertical,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: padding.screen.vertical,
    left: padding.screen.horizontal,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  headerTitle: {
    ...typography.title.title1,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontWeight: '600',
  },
  heroWrap: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
  },
  heroContent: {
    alignItems: 'center',
    width: '100%',
    paddingTop: spacing.xl,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['5xl'],
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
