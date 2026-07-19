import { Text } from '../common/Text';
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
                : 'Tap "Measure heart rate" above to log your first reading.'
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
              iconColor: string;
              iconBg: string;
              value: string;
            }[] = [];
            if (stress != null && stressZone != null) {
              metrics.push({
                key: 'stress',
                iconColor: stressZone.color,
                iconBg: stressZone.color + '22',
                value: `${stressZone.label} stress`,
              });
            }
            if (item.hrDrop != null) {
              metrics.push({
                key: 'hrDrop',
                iconColor: colors.primary.blue600,
                iconBg: colors.primary.blue100,
                value: `${item.hrDrop} HR drop`,
              });
            }

            return (
              <CardSurface
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
                    <Text style={styles.time}>{formatTime(item.startedAt)}</Text>
                  </View>
                  <Text style={styles.duration}>
                    {formatReadingDuration(item.durationSeconds)} reading
                  </Text>
                  {metrics.length > 0 ? (
                    <View style={styles.metricRow}>
                      {metrics.map((m) => (
                        <MetricInline
                          key={m.key}
                          iconColor={m.iconColor}
                          iconBg={m.iconBg}
                          value={m.value}
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
    gap: spacing.md,
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
    fontSize: 32,
    lineHeight: 34,
    fontFamily: fonts.semibold,
    color: colors.error[500],
    letterSpacing: -0.8,
  },
  thumbUnit: {
    ...typography.caption.caption2,
    fontFamily: fonts.semibold,
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
  label: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  time: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
  },
  duration: {
    ...typography.body.small,
    fontFamily: fonts.regular,
    fontWeight: '400',
    color: colors.text.tertiary,
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
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
  metricInlineValue: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
  },
});
