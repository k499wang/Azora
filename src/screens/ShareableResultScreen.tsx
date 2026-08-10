import { Text } from '../components/common/Text';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography, fonts } from '../theme/typography';
import { spacing, padding, margin } from '../theme/spacing';
import DailyCompleteSheet from '../features/room/DailyCompleteSheet';
import ChunkyButton from '../components/common/ChunkyButton';
import HelpfulnessQuestion from '../components/exercise/HelpfulnessQuestion';
import { BREATH_HOLD_FEEDBACK_ID } from '../lib/sessionKey';
import BlobCharacter from '../components/home/BlobCharacter';
import { BREATH_HOLD_STYLE } from '../features/exercise/guidedBreathing/categoryPalette';
import { useTodayLocalDate } from '../hooks/useTodayLocalDate';
import { card } from '../theme/card';
import HeartRateStatsSection from '../components/heartRate/HeartRateStatsSection';
import GlassIconButton from '../components/common/GlassIconButton';
import { SESSION_GLASS_BUTTON_SIZE } from '../features/exercise/shared/components/SessionGlassButton';
import type { DailyResultScreenProps } from '../app/navigation';
import { estimateLungAge } from '../lib/lungAge';
import { benchmarkBreathHold } from '../lib/breathHoldPercentile';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { trackFeatureGateHit } from '../services/analytics/tracking';
import { PaywallPlacement } from '../services/paywall';
import { FeatureKey } from '../services/subscriptions/featureAccess';
import { useAuthStore } from '../stores/authStore';
import { useProfileQuery } from '../queries/profile/useProfileQuery';
import { APP_STORE_URL } from '../lib/appStoreLink';
import {
  maybeRequestSessionReview,
  ReviewTrigger,
} from '../services/reviews/storeReview';

// The breath hold is not a guided technique, but feedback is stored per
// technique id, so it answers under its own key.

const HERO_BLOB_SIZE = 132;

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ShareableResultScreen({
  navigation,
  route,
}: DailyResultScreenProps) {
  const insets = useSafeAreaInsets();
  const advancedStatsAccess = useFeatureAccess(FeatureKey.AdvancedStats);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const profileQuery = useProfileQuery(userId);
  const userAge = profileQuery.data?.age ?? null;
  const firstName =
    profileQuery.data?.displayName?.trim().split(/\s+/)[0] ?? null;
  const todayLocalDate = useTodayLocalDate();
  const hue = BREATH_HOLD_STYLE.hue;
  const {
    holdSeconds,
    sessionKey,
    heartRateResultStatus = 'not_measured',
    avgBpm,
    minBpm,
    maxBpm,
    bpmSamples = [],
  } = route.params;
  const hrDropBpm =
    minBpm != null && maxBpm != null ? Math.max(0, maxBpm - minBpm) : null;

  // Always shown: this screen is only reachable from the daily breath hold, so
  // reaching it always means a daily just moved.
  const [sheetVisible, setSheetVisible] = useState(true);
  // Same reason as the breathing screen: the heart-rate section is expensive
  // and must not build itself while the sheet is animating.
  const [sheetSettled, setSheetSettled] = useState(false);
  const showResults = !sheetVisible || sheetSettled;

  // Held until the sheet is gone — a store-review prompt landing on top of the
  // celebration would eat it.
  useEffect(() => {
    if (sheetVisible) return;
    void maybeRequestSessionReview(ReviewTrigger.BreathHold);
  }, [sheetVisible]);

  const lungAge = estimateLungAge(holdSeconds, userAge);
  const benchmark =
    userAge != null ? benchmarkBreathHold(holdSeconds, userAge) : null;
  const comparisonLabel = benchmark
    ? `Top ${benchmark.topPercent}% of people your age`
    : null;
  const congratulation =
    firstName == null ? 'Nice work' : `Nice work, ${firstName}`;
  const advancedStatsLocked =
    !advancedStatsAccess.allowed && !advancedStatsAccess.isLoading;

  const handleShare = useCallback(async () => {
    try {
      const message = benchmark
        ? `My lung age is ${lungAge.years}. I am in the top ${benchmark.topPercent}% of people my age. Can you beat me?\n\n${APP_STORE_URL}`
        : `My lung age is ${lungAge.years}. Can you beat me?\n\n${APP_STORE_URL}`;
      await Share.share({ message });
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

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <DailyCompleteSheet
        visible={sheetVisible}
        hue={hue}
        character={BREATH_HOLD_STYLE.character}
        title={congratulation}
        subtitle="Daily breath hold"
        stats={[
          { label: 'Hold', value: formatDuration(holdSeconds) },
          { label: 'Lung age', value: `${lungAge.years}` },
        ]}
        onSettled={() => setSheetSettled(true)}
        onDismiss={() => setSheetVisible(false)}
      />

      {/* In the flow, not over it. These used to be absolutely positioned, so
          the hero card scrolled underneath them and the first thing you saw was
          partly covered by its own controls. */}
      {showResults ? (
        <View style={styles.topBar}>
          <GlassIconButton
            size={SESSION_GLASS_BUTTON_SIZE}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
          >
            <MaterialCommunityIcons
              name="close"
              size={20}
              color={colors.text.secondary}
            />
          </GlassIconButton>
          <GlassIconButton
            size={SESSION_GLASS_BUTTON_SIZE}
            onPress={handleShare}
          >
            <MaterialCommunityIcons
              name="share-variant"
              size={20}
              color={colors.primary.blue600}
            />
          </GlassIconButton>
        </View>
      ) : null}

      {showResults ? (
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroWrap}>
          <View style={styles.heroShadow}>
            <View style={[styles.heroCard, { backgroundColor: hue.base }]}>
              <BlobCharacter
                character={BREATH_HOLD_STYLE.character}
                faceExpression="energy"
                size={HERO_BLOB_SIZE}
                bodyColor={hue.soft}
                faceColor={hue.ink}
              />
              <Text style={styles.heroTitle}>{congratulation}</Text>
              <Text style={styles.heroSubtitle}>
                Breath hold · {formatDuration(holdSeconds)}
              </Text>
              {comparisonLabel == null ? null : (
                <Text style={styles.heroBadge}>{comparisonLabel}</Text>
              )}
            </View>
          </View>
        </View>

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

        <View style={styles.bodySection}>
          <HelpfulnessQuestion
            techniqueId={BREATH_HOLD_FEEDBACK_ID}
            localDate={todayLocalDate}
            sessionKey={sessionKey}
          />
        </View>

        <ChunkyButton
          label="Share my result"
          shape="card"
          style={styles.shareCta}
          icon={
            <MaterialCommunityIcons
              name="share-variant"
              size={20}
              color={colors.text.inverse}
            />
          }
          onPress={handleShare}
        />
      </ScrollView>
      ) : null}

    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  scrollContent: {
    paddingBottom: spacing['5xl'],
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: padding.screen.horizontal,
    paddingVertical: padding.screen.vertical,
  },
  heroWrap: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
  },
  heroShadow: {
    ...card.blockShadow,
  },
  heroCard: {
    ...card.block,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  heroTitle: {
    ...typography.display.display3,
    color: colors.text.inverse,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  heroSubtitle: {
    ...typography.body.medium,
    color: colors.onBlock.textMuted,
    textAlign: 'center',
  },
  heroBadge: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
    backgroundColor: colors.onBlock.fill,
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
  },
  bodySection: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
    gap: margin.itemGap,
  },
  statsSection: {
    marginTop: margin.resultSection,
  },
  shareCta: {
    marginHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
  },
});
