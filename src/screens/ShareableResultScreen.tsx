import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography, fonts } from '../theme/typography';
import { spacing, padding, margin } from '../theme/spacing';
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
  'light-smoker':  { label: 'Light Smoker',  color: colors.orange[600],     icon: 'smoking' },
  'heavy-smoker':  { label: 'Heavy Smoker',  color: colors.error[500],      icon: 'smoking-off' },
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
    maxBpm,
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
    maxBpm != null
      ? { icon: 'arrow-up', label: 'Max HR', value: String(maxBpm), unit: 'bpm' }
      : { icon: 'arrow-up', label: 'Max HR', value: 'Unavailable', unavailable: true },
  ];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable
            style={styles.closeButton}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
          >
            <MaterialCommunityIcons name="close" size={24} color={colors.text.secondary} />
          </Pressable>
          <Text style={styles.title}>Your Results</Text>
        </View>

        <View style={styles.lungHealthSection}>
          <View style={styles.lungMedallionOuter}>
            <View
              style={[
                styles.lungMedallionGlow,
                { backgroundColor: health.color + '14' },
              ]}
            />
            <View
              style={[
                styles.lungMedallion,
                { backgroundColor: health.color + '22', borderColor: health.color + '55' },
              ]}
            >
              <MaterialCommunityIcons
                name={health.icon}
                size={72}
                color={health.color}
              />
            </View>
          </View>

          <Text style={styles.lungCardLabel}>Estimated lung age</Text>
          <View style={styles.lungAgeRow}>
            <Text style={styles.lungAgeValue}>{lungEstimate.age}</Text>
            <Text style={styles.lungAgeUnit}>yrs</Text>
          </View>
          <View style={[styles.healthBadge, { backgroundColor: health.color + '1A' }]}>
            <Text style={[styles.healthBadgeText, { color: health.color }]}>
              {health.label}
            </Text>
          </View>

          <View style={styles.lungChipRow}>
            <View style={styles.lungChip}>
              <MaterialCommunityIcons
                name="timer-outline"
                size={14}
                color={colors.text.secondary}
              />
              <Text style={styles.lungChipValue}>{holdTime}</Text>
              <Text style={styles.lungChipLabel}>hold</Text>
            </View>
            {avgBpm != null ? (
              <View style={styles.lungChip}>
                <MaterialCommunityIcons
                  name="heart-pulse"
                  size={14}
                  color={colors.text.secondary}
                />
                <Text style={styles.lungChipValue}>{avgBpm}</Text>
                <Text style={styles.lungChipLabel}>avg HR</Text>
              </View>
            ) : null}
            {lungEstimate.hrDropBpm != null ? (
              <View style={styles.lungChip}>
                <MaterialCommunityIcons
                  name="arrow-down"
                  size={14}
                  color={colors.text.secondary}
                />
                <Text style={styles.lungChipValue}>{lungEstimate.hrDropBpm}</Text>
                <Text style={styles.lungChipLabel}>HR drop</Text>
              </View>
            ) : null}
          </View>
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
  // Screen
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    paddingBottom: spacing['5xl'],
  },

  // Header
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

  // Lung Health Hero
  lungHealthSection: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
    alignItems: 'center',
  },
  lungMedallionOuter: {
    width: 168,
    height: 168,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  lungMedallionGlow: {
    position: 'absolute',
    width: 168,
    height: 168,
    borderRadius: 84,
    opacity: 0.85,
  },
  lungMedallion: {
    width: 124,
    height: 124,
    borderRadius: 62,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lungCardLabel: {
    ...typography.label.medium,
    color: colors.text.secondary,
    fontFamily: fonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  lungAgeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    marginTop: 2,
  },
  lungAgeValue: {
    ...typography.display.display1,
    fontSize: 64,
    lineHeight: 72,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontWeight: '500',
  },
  lungAgeUnit: {
    ...typography.body.medium,
    color: colors.text.tertiary,
    fontFamily: fonts.semibold,
  },
  healthBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: spacing.xs,
  },
  healthBadgeText: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    fontWeight: '600',
  },
  lungChipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  lungChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: 999,
  },
  lungChipValue: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
  },
  lungChipLabel: {
    ...typography.caption.caption1,
    color: colors.text.tertiary,
  },

  heartResultSection: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
  },
});
