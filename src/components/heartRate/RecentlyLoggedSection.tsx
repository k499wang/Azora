import { Text } from '../common/Text';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { usePostHog } from 'posthog-react-native';
import CardSurface from '../common/CardSurface';
import EmptyStateCard from '../home/EmptyStateCard';
import SectionHeader from '../common/SectionHeader';
import { getStressZone } from '../../lib/heartRate/stress';
import { AnalyticsEvent } from '../../services/analytics/events';
import { trackFeatureGateHit } from '../../services/analytics/tracking';
import { colors } from '../../theme/colors';
import { spacing, padding } from '../../theme/spacing';
import { typography, fonts } from '../../theme/typography';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { FeatureKey } from '../../services/subscriptions/featureAccess';
import { PaywallPlacement } from '../../services/paywall';
import type { TodayHeartRateSummary } from '../../services/tracking/types';
import type { MainTabNavigationProp } from '../../app/navigation/types';

interface RecentlyLoggedSectionProps {
  items: TodayHeartRateSummary[];
  hasError: boolean;
  isLoading: boolean;
}

function formatRelativeDay(value: string): string {
  const date = new Date(value);
  const now = new Date();
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(date);
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatReadingDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

function MetricInline({
  iconColor,
  iconBg,
  value,
}: {
  iconColor: string;
  iconBg: string;
  value: string;
}) {
  return (
    <View style={styles.metricInline}>
      <View style={[styles.metricDot, { backgroundColor: iconBg }]}>
        <View style={[styles.metricDotInner, { backgroundColor: iconColor }]} />
      </View>
      <Text style={styles.metricInlineValue}>{value}</Text>
    </View>
  );
}

export function RecentlyLoggedSection({
  items,
  hasError,
  isLoading,
}: RecentlyLoggedSectionProps) {
  const navigation = useNavigation<MainTabNavigationProp<'Heart'>>();
  const posthog = usePostHog();
  const isFocused = useIsFocused();
  const sessionHistoryAccess = useFeatureAccess(FeatureKey.SessionHistory);
  const trackedViewRef = useRef(false);

  // Fire RecentlyLoggedViewed once the user actually focuses the tab —
  // background tabs are mounted eagerly, so an `useEffect` alone would
  // double-count on first launch.
  useEffect(() => {
    if (!isFocused) return;
    if (trackedViewRef.current) return;
    if (isLoading) return;
    trackedViewRef.current = true;
    posthog?.capture(AnalyticsEvent.RecentlyLoggedViewed, {
      item_count: items.length,
      has_error: hasError,
    });
  }, [hasError, isFocused, isLoading, items, posthog]);

  const handleItemPress = (sessionId: string, position: number) => {
    posthog?.capture(AnalyticsEvent.RecentlyLoggedSessionOpened, {
      session_id: sessionId,
      position,
      item_count: items.length,
    });
    if (sessionHistoryAccess.isLoading) return;
    if (position > 0 && !sessionHistoryAccess.allowed) {
      trackFeatureGateHit({
        feature: FeatureKey.SessionHistory,
        placement: PaywallPlacement.DailyResultProGate,
        sourceScreen: 'Heart',
        sourceAction: 'recently_logged_history',
        access: sessionHistoryAccess,
      });
      navigation.navigate('ProPaywall', {
        placement: PaywallPlacement.DailyResultProGate,
        sourceScreen: 'Heart',
        sourceAction: 'recently_logged_history',
        feature: FeatureKey.SessionHistory,
      });
      return;
    }
    navigation.navigate('HeartRateSessionDetail', { sessionId });
  };

  return (
    <View style={styles.section}>
      <View style={styles.headerWrap}>
        <SectionHeader title="Recently Logged" />
      </View>
      {items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyStateCard
            title="No heart rate logged yet"
            subtitle={
              hasError
                ? 'Stats could not load from Supabase.'
                : 'Tap the plus button in the top right to start measuring.'
            }
          />
        </View>
      ) : (
        <View style={styles.list}>
          {items.map((item, index) => {
            const stress = item.stress;
            const stressZone = stress == null ? null : getStressZone(stress);
            const metrics: {
              key: string;
              value: string;
              iconColor: string;
              iconBg: string;
            }[] = [];
            if (stress != null && stressZone != null) {
              metrics.push({
                key: 'stress',
                value: `${stressZone.label} stress`,
                iconColor: stressZone.color,
                iconBg: `${stressZone.color}22`,
              });
            }
            if (item.hrDrop != null) {
              metrics.push({
                key: 'hrDrop',
                value: `${item.hrDrop} HR drop`,
                iconColor: colors.primary.blue600,
                iconBg: colors.primary.blue100,
              });
            }

            return (
              <CardSurface
                elevated
                key={item.sessionId}
                onPress={() => handleItemPress(item.sessionId, index)}
                style={styles.card}
              >
                <View style={styles.thumb}>
                  <Text style={styles.thumbBpm}>{item.avgBpm ?? '--'}</Text>
                  <Text style={styles.thumbUnit}>bpm</Text>
                </View>
                <View style={styles.body}>
                  <View style={styles.rowTop}>
                    <Text style={styles.label}>
                      {formatRelativeDay(item.startedAt)}
                    </Text>
                    <View style={styles.timeWrap}>
                      <MaterialCommunityIcons
                        name="clock-outline"
                        size={14}
                        color={colors.text.secondary}
                      />
                      <Text style={styles.metadataText}>
                        {formatTime(item.startedAt)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.metadataText}>
                    {formatReadingDuration(item.durationSeconds)} reading
                  </Text>
                  {metrics.length > 0 ? (
                    <View style={styles.metricRow}>
                      {metrics.map((m) => (
                        <MetricInline
                          key={m.key}
                          value={m.value}
                          iconColor={m.iconColor}
                          iconBg={m.iconBg}
                        />
                      ))}
                    </View>
                  ) : null}
                </View>
              </CardSurface>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.lg,
  },
  headerWrap: {
    paddingHorizontal: padding.screen.horizontal,
  },
  emptyWrap: {
    paddingHorizontal: padding.screen.horizontal,
  },
  list: {
    gap: spacing.sm,
    paddingHorizontal: padding.screen.horizontal,
  },
  card: {
    backgroundColor: colors.background.elevated,
    borderWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  thumb: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
  },
  thumbBpm: {
    ...typography.display.display3,
    fontFamily: fonts.medium,
    fontWeight: '500',
    color: colors.error[500],
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  thumbUnit: {
    ...typography.label.large,
    fontFamily: fonts.bold,
    fontWeight: '600',
    color: colors.error[500],
    marginTop: 1,
    letterSpacing: 0.5,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    ...typography.heading.heading1,
    color: colors.text.primary,
  },
  metadataText: {
    ...typography.label.detail,
    color: colors.text.secondary,
  },
  metricInlineValue: {
    ...typography.heading.heading2,
    color: colors.text.secondary,
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.md,
    rowGap: spacing.xs,
  },
  metricInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metricDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
