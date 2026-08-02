import { Text } from '../components/common/Text';
import { useCallback } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography, fonts } from '../theme/typography';
import { spacing, padding, margin } from '../theme/spacing';
import { card } from '../theme/card';
import HeartRateStatsSection from '../components/heartRate/HeartRateStatsSection';
import ScoreRing from '../components/exercise/ScoreRing';
import GlassIconButton from '../components/common/GlassIconButton';
import AmbientBackground from '../components/common/AmbientBackground';
import type { DailyResultScreenProps } from '../app/navigation';
import {
  estimateLungAge,
  lungAgeRingFill,
  lungAgeToneMeta,
} from '../lib/lungAge';
import { benchmarkBreathHold } from '../lib/breathHoldPercentile';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { trackFeatureGateHit } from '../services/analytics/tracking';
import { PaywallPlacement } from '../services/paywall';
import { FeatureKey } from '../services/subscriptions/featureAccess';
import { useAuthStore } from '../stores/authStore';
import { useProfileQuery } from '../queries/profile/useProfileQuery';

const APP_STORE_URL =
  'https://apps.apple.com/us/app/azora-heart-rate-breathing/id6763631574';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ShareableResultScreen({
  navigation,
  route,
}: DailyResultScreenProps) {
  const insets = useSafeAreaInsets();
  const advancedStatsAccess = useFeatureAccess(FeatureKey.AdvancedStats);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const profileQuery = useProfileQuery(userId);
  const userAge = profileQuery.data?.age ?? null;
  const {
    holdSeconds,
    heartRateResultStatus = 'not_measured',
    avgBpm,
    minBpm,
    maxBpm,
    bpmSamples = [],
  } = route.params;
  const hrDropBpm =
    minBpm != null && maxBpm != null ? Math.max(0, maxBpm - minBpm) : null;
  const lungAge = estimateLungAge(holdSeconds, userAge);
  const benchmark =
    userAge != null ? benchmarkBreathHold(holdSeconds, userAge) : null;
  const comparisonLabel = benchmark
    ? `Top ${benchmark.topPercent}% of people your age`
    : null;
  const lungAgeTone = lungAgeToneMeta(lungAge.deltaYears);
  const advancedStatsLocked =
    !advancedStatsAccess.allowed && !advancedStatsAccess.isLoading;
  const handleShare = useCallback(async () => {
    try {
      const message = benchmark
        ? `My lung age is ${lungAge.years}. I am in the top ${benchmark.topPercent}% of people my age. Can you beat me?\n\n${APP_STORE_URL}`
        : `My lung age is ${lungAge.years}. Can you beat me?\n\n${APP_STORE_URL}`;
      await Share.share({
        message,
      });
    } catch {
      Alert.alert('Could not share', 'Please try again.');
    }
  }, [benchmark, lungAge.years]);
  const showAdvancedStatsPaywall = useCallback(() => {
    trackFeatureGateHit({
      feature: FeatureKey.AdvancedStats,
      placement: PaywallPlacement.DailyResultProGate,
      sourceScreen: 'DailyResult',
      sourceAction: 'result_stats',
      access: advancedStatsAccess,
    });
    navigation.navigate('ProPaywall', {
      placement: PaywallPlacement.DailyResultProGate,
      sourceScreen: 'DailyResult',
      sourceAction: 'result_stats',
      feature: FeatureKey.AdvancedStats,
    });
  }, [advancedStatsAccess, navigation]);

  const renderHeroCard = () => (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>Breathhold Exercise</Text>
      </View>

      <View style={styles.heroCardWrap}>
        <View style={styles.heroCard}>
          <ScoreRing
            value={lungAge.years}
            fill={lungAgeRingFill(lungAge.years)}
            ringColors={lungAgeTone.ringColors}
            caption="Lung Age"
            captionFontSize={18}
            captionPosition="bottom"
            captionTextTransform="none"
            gapLabel={comparisonLabel}
            gapTextColor={lungAgeTone.textColor}
            gapDirection={lungAgeTone.direction}
          />
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <AmbientBackground />
      <View style={[styles.screenInner, { paddingTop: insets.top }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderHeroCard()}

          <View style={styles.statsSection}>
            <HeartRateStatsSection
              hrDrop={hrDropBpm}
              minBpm={minBpm ?? null}
              maxBpm={maxBpm ?? null}
              avgBpm={avgBpm ?? null}
              age={userAge}
              bpmSamples={bpmSamples}
              locked={advancedStatsLocked}
              onPressUpgrade={showAdvancedStatsPaywall}
              emptyChartMessage={
                heartRateResultStatus === 'insufficient_beats'
                  ? 'Not enough reliable heartbeats were detected during this hold to show heart-rate results.'
                  : 'Complete your breath hold with heart rate enabled to see your BPM.'
              }
              insightContext="breath-hold"
            />
          </View>

          <Pressable
            style={styles.shareCta}
            onPress={handleShare}
          >
            <MaterialCommunityIcons
              name="share-variant"
              size={20}
              color={colors.text.inverse}
            />
            <Text style={styles.shareCtaLabel}>Share my result</Text>
          </Pressable>
        </ScrollView>

        {/* Glassmorphic top buttons — fixed above the scroll */}
        <GlassIconButton
          style={[styles.closeButton, { top: insets.top + padding.screen.vertical }]}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
        >
          <MaterialCommunityIcons name="close" size={22} color={colors.text.secondary} />
        </GlassIconButton>
        <GlassIconButton
          style={[styles.shareButton, { top: insets.top + padding.screen.vertical }]}
          onPress={handleShare}
        >
          <MaterialCommunityIcons
            name="share-variant"
            size={20}
            color={colors.primary.blue600}
          />
        </GlassIconButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  screenInner: {
    flex: 1,
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
    left: padding.screen.horizontal,
    zIndex: 1,
  },
  shareButton: {
    position: 'absolute',
    right: padding.screen.horizontal,
    zIndex: 1,
  },
  title: {
    ...typography.title.title1,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontWeight: '500',
  },

  heroCardWrap: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
  },
  heroCard: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  shareCta: {
    ...card.shadow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: padding.screen.horizontal,
    marginTop: margin.resultSection,
    paddingVertical: spacing.md,
    borderRadius: spacing.md,
    backgroundColor: colors.primary.blue600,
  },
  shareCtaLabel: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.inverse,
  },
  statsSection: {
    marginTop: margin.resultSection,
  },
});
