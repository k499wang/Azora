import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography, fonts } from '../theme/typography';
import { spacing, padding, margin } from '../theme/spacing';
import { card } from '../theme/card';
import { HeartRateResultContent } from '../components/heartRate/HeartRateResultContent';
import type { HeartRateResultStat } from '../components/heartRate/HeartRateResultContent';
import type { DailyResultScreenProps } from '../app/navigation';
import { estimateLungAge, type LungHealthKey } from '../lib/lungAge';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { PaywallPlacement } from '../services/paywall';
import { FeatureKey } from '../services/subscriptions/featureAccess';

// ───────────��──────────────────────────────────────��─────────────────────────────

const LUNG_HEALTH_MAP: Record<
  LungHealthKey,
  { label: string; color: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }
> = {
  'elite':         { label: 'Elite Athlete', color: colors.primary.blue600, icon: 'trophy' },
  'very-healthy':  { label: 'Very Healthy',  color: colors.success[500],    icon: 'lungs' },
  'healthy':       { label: 'Healthy',       color: colors.success[700],    icon: 'leaf' },
  'average':       { label: 'Average',       color: colors.warning[500],    icon: 'minus-circle-outline' },
  'below-average': { label: 'Below Average', color: colors.orange[500],     icon: 'alert-circle-outline' },
  'light-smoker':  { label: 'Could Improve', color: colors.orange[600],    icon: 'arrow-up-bold-circle-outline' },
  'heavy-smoker':  { label: 'Needs Work',    color: colors.error[500],     icon: 'alert-circle-outline' },
};

function formatTime(secs: number) {
  const minutes = Math.floor(secs / 60);
  const seconds = secs % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function ShareableResultScreen({
  navigation,
  route,
}: DailyResultScreenProps) {
  const insets = useSafeAreaInsets();
  const advancedStatsAccess = useFeatureAccess(FeatureKey.AdvancedStats);
  const {
    holdSeconds,
    avgBpm,
    minBpm,
    rmssd,
    hrDrop,
    stress,
    confidence,
    sampleCount,
    hrvAvailabilityReason,
    ibiSamples = [],
  } = route.params;
  const lungEstimate = estimateLungAge({ holdSeconds, avgBpm, minBpm });
  const health = LUNG_HEALTH_MAP[lungEstimate.key];
  const holdTime = formatTime(holdSeconds);
  const advancedStatsLocked =
    !advancedStatsAccess.allowed && !advancedStatsAccess.isLoading;
  const showAdvancedStatsPaywall = useCallback(() => {
    navigation.navigate('ProPaywall', {
      placement: PaywallPlacement.DailyResultProGate,
      sourceScreen: 'DailyResult',
      feature: FeatureKey.AdvancedStats,
    });
  }, [navigation]);

  const extraStats: HeartRateResultStat[] = [
    { icon: 'timer-outline', label: 'Hold Time', value: holdTime, unit: 'min' },
    minBpm != null
      ? { icon: 'arrow-down', label: 'Min HR', value: String(minBpm), unit: 'bpm' }
      : { icon: 'arrow-down', label: 'Min HR', value: 'Unavailable', unavailable: true },
  ];

  const heroStats: Array<{
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    value: string;
    label: string;
    tint: string;
    unavailable?: boolean;
  }> = [
    { icon: 'timer-sand', value: holdTime, label: 'Hold', tint: colors.primary.blue500 },
    avgBpm != null
      ? {
          icon: 'heart-pulse',
          value: String(avgBpm),
          label: 'Avg HR',
          tint: colors.error[500],
        }
      : {
          icon: 'heart-pulse',
          value: 'Unavailable',
          label: 'Avg HR',
          tint: colors.error[500],
          unavailable: true,
        },
    lungEstimate.hrDropBpm != null
      ? {
          icon: 'trending-down',
          value: String(lungEstimate.hrDropBpm),
          label: 'Max HR Drop',
          tint: colors.success[500],
        }
      : {
          icon: 'trending-down',
          value: 'Unavailable',
          label: 'Max HR Drop',
          tint: colors.success[500],
          unavailable: true,
        },
  ];
  const hasUnavailable = heroStats.some((s) => s.unavailable);
  const encouragement = hasUnavailable
    ? `Try holding your breath a bit longer next time — a longer hold gives us enough signal to unlock more of your stats.`
    : `You held your breath for ${holdTime} — keep the streak alive.`;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            style={styles.closeButton}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
          >
            <MaterialCommunityIcons name="close" size={22} color={colors.text.secondary} />
          </Pressable>
          <Text style={styles.title}>Nice work!</Text>
        </View>

        <View style={styles.heroCardWrap}>
          <View
            style={[
              styles.heroCard,
              card.shadow,
              { backgroundColor: health.color + '0F', borderColor: health.color + '33' },
            ]}
          >
            <View
              style={[
                styles.ribbon,
                { backgroundColor: health.color },
              ]}
            >
              <MaterialCommunityIcons
                name="medal"
                size={14}
                color={colors.text.inverse}
              />
              <Text style={styles.ribbonText}>{health.label}</Text>
            </View>

            <Text style={styles.lungCardLabel}>Estimated lung age</Text>
            <View style={styles.lungAgeRow}>
              <Text style={styles.lungAgeValue}>{lungEstimate.age}</Text>
              <Text style={styles.lungAgeUnit}>yrs</Text>
            </View>
            <Text style={styles.encouragement}>{encouragement}</Text>
          </View>
        </View>

        <View style={styles.statTileRow}>
          {heroStats.map((stat) => (
            <View
              key={stat.label}
              style={[
                styles.statTile,
                card.base,
                stat.unavailable && styles.statTileUnavailable,
              ]}
            >
              <View
                style={[
                  styles.statIconBubble,
                  {
                    backgroundColor: stat.unavailable
                      ? colors.neutral[100]
                      : stat.tint + '1F',
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={stat.icon}
                  size={18}
                  color={stat.unavailable ? colors.text.tertiary : stat.tint}
                />
              </View>
              <Text
                style={[
                  styles.statValue,
                  stat.unavailable && styles.statValueUnavailable,
                ]}
              >
                {stat.value}
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.heartResultSection}>
          <HeartRateResultContent
            bpm={avgBpm ?? '—'}
            confidence={confidence}
            sampleCount={sampleCount}
            rmssd={rmssd}
            hrDrop={hrDrop}
            stress={stress}
            hrvAvailabilityReason={hrvAvailabilityReason}
            ibiSamples={ibiSamples}
            extraStats={extraStats}
            showHero={false}
            advancedStatsLocked={advancedStatsLocked}
            onPressUpgrade={showAdvancedStatsPaywall}
          />
        </View>
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
  title: {
    ...typography.title.title1,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontWeight: '600',
  },

  heroCardWrap: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
  },
  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    overflow: 'hidden',
  },
  ribbon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: spacing.md,
  },
  ribbonText: {
    ...typography.label.small,
    color: colors.text.inverse,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    letterSpacing: 0.4,
  },

  lungCardLabel: {
    ...typography.label.small,
    color: colors.text.secondary,
    fontFamily: fonts.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  lungAgeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    marginTop: 2,
  },
  lungAgeValue: {
    ...typography.display.display1,
    fontSize: 72,
    lineHeight: 78,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontWeight: '600',
  },
  lungAgeUnit: {
    ...typography.body.medium,
    color: colors.text.tertiary,
    fontFamily: fonts.semibold,
  },
  encouragement: {
    ...typography.body.small,
    color: colors.text.secondary,
    fontFamily: fonts.semibold,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },

  statTileRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: padding.screen.horizontal,
    marginTop: spacing.md,
  },
  statTile: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    borderRadius: 18,
  },
  statIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statValue: {
    ...typography.title.title3,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontWeight: '600',
  },
  statValueUnavailable: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.tertiary,
  },
  statTileUnavailable: {
    opacity: 0.75,
  },
  statLabel: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
    fontFamily: fonts.semibold,
    marginTop: 2,
  },

  heartResultSection: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
  },
});
