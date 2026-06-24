import { useCallback, useRef, useState } from 'react';
import { Alert, Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Background2066 } from '../components/common/Background2066';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography, fonts } from '../theme/typography';
import { spacing, padding, margin } from '../theme/spacing';
import { card } from '../theme/card';
import { LockedOverlay } from '../components/heartRate/HeartRateResultContent';
import BPMChart from '../components/heartRate/BPMChart';
import ShareCard from '../components/exercise/ShareCard';
import ScoreRing from '../components/exercise/ScoreRing';
import AzoraScoreInfoDialog from '../components/exercise/AzoraScoreInfoDialog';
import SectionHeader from '../components/common/SectionHeader';
import ThermometerStatCard from '../components/heartRate/ThermometerStatCard';
import GlassIconButton from '../components/common/GlassIconButton';
import type { DailyResultScreenProps } from '../app/navigation';
import { estimateAzoraScore, azoraScoreFill, azoraTierMeta } from '../lib/azoraScore';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { trackFeatureGateHit } from '../services/analytics/tracking';
import { PaywallPlacement } from '../services/paywall';
import { FeatureKey } from '../services/subscriptions/featureAccess';
import { useAuthStore } from '../stores/authStore';
import { useProfileQuery } from '../queries/profile/useProfileQuery';
import { getHoldBenchmark } from '../lib/breathHoldBenchmark';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SCREEN_WIDTH = Dimensions.get('window').width;

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
    avgBpm,
    minBpm,
    maxBpm,
    bpmSamples = [],
  } = route.params;
  const hrDropBpm =
    minBpm != null && maxBpm != null ? Math.max(0, maxBpm - minBpm) : null;
  const azoraEstimate = estimateAzoraScore({ holdSeconds, avgBpm, minBpm });
  const azoraTier = azoraTierMeta(azoraEstimate.key);
  const [infoVisible, setInfoVisible] = useState(false);
  const benchmark = getHoldBenchmark(holdSeconds, userAge);

  const benchmarkCard = (() => {
    const b = benchmark.percentileBucket;
    if (b === 'top10') return { icon: 'trophy' as const, accent: '#F59E0B' };
    if (b === 'top25') return { icon: 'star' as const, accent: '#10B981' };
    if (b === 'aboveAverage') return { icon: 'arrow-up-bold' as const, accent: colors.primary.blue500 };
    if (b === 'average') return { icon: 'equal' as const, accent: colors.neutral[500] };
    return { icon: 'target' as const, accent: '#F97316' };
  })();

  const advancedStatsLocked =
    !advancedStatsAccess.allowed && !advancedStatsAccess.isLoading;
  const artifactRef = useRef<ViewShot>(null);
  const [shareArtifactReady, setShareArtifactReady] = useState(false);
  const handleShare = useCallback(async () => {
    if (!shareArtifactReady) return;
    try {
      const node = artifactRef.current;
      if (node?.capture == null) return;
      const uri = await node.capture();
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert('Sharing unavailable', 'This device does not support sharing.');
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share your result',
      });
    } catch {
      Alert.alert('Could not share', 'Please try again.');
    }
  }, [shareArtifactReady]);
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
        <Text style={styles.title}>Nice work!</Text>
      </View>

      <View style={styles.heroCardWrap}>
        <View style={styles.heroCard}>
          <ScoreRing
            value={azoraEstimate.score}
            fill={azoraScoreFill(azoraEstimate.score)}
            ringColors={azoraTier.ringColors}
            gapLabel={null}
            onInfoPress={() => setInfoVisible(true)}
          />
          <View style={styles.benchmarkCard}>
            <View style={styles.benchmarkIconWrap}>
              <MaterialCommunityIcons
                name={benchmarkCard.icon}
                size={18}
                color={benchmarkCard.accent}
              />
            </View>
            <Text style={styles.benchmarkSentence}>{benchmark.sentence}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      {/* Fixed background image with quick fade to white */}
      <Background2066 style={styles.bgImage} />
      <LinearGradient
        colors={[
          'rgba(248,251,255,0)',
          'rgba(248,251,255,0.55)',
          'rgba(248,251,255,1)',
        ]}
        locations={[0, 0.25, 0.45]}
        style={styles.bgGradient}
        pointerEvents="none"
      />

      <View style={[styles.screenInner, { paddingTop: insets.top }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderHeroCard()}

          <View style={styles.statsHeader}>
            <SectionHeader title="Statistics" />
          </View>

          <LockedOverlay
            locked={advancedStatsLocked}
            onPressUpgrade={showAdvancedStatsPaywall}
          >
            <View style={styles.tileRow}>
              <ThermometerStatCard
                label="Avg HR"
                value={avgBpm}
                unit="bpm"
                min={40}
                max={120}
                accent={colors.error[500]}
              />
              <ThermometerStatCard
                label="HR drop"
                value={hrDropBpm}
                unit="bpm"
                min={0}
                max={30}
                accent={colors.primary.blue500}
              />
            </View>

            {bpmSamples.length >= 2 ? (
              <View style={styles.heartHealthCard}>
                <BPMChart bpmSamples={bpmSamples} color={colors.primary.blue500} />
              </View>
            ) : null}
          </LockedOverlay>

          <Pressable
            disabled={!shareArtifactReady}
            style={[styles.shareCta, !shareArtifactReady && styles.shareDisabled]}
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
          disabled={!shareArtifactReady}
          style={[styles.shareButton, { top: insets.top + padding.screen.vertical }]}
          onPress={handleShare}
        >
          <MaterialCommunityIcons
            name="share-variant"
            size={20}
            color={colors.primary.blue600}
          />
        </GlassIconButton>

        {/* Off-screen share artifact */}
        <View
          pointerEvents="none"
          style={styles.offscreenArtifactWrap}
          collapsable={false}
        >
          <ViewShot
            ref={artifactRef}
            options={{ format: 'png', quality: 0.95, width: 1080, height: 1080, result: 'tmpfile' }}
          >
            <ShareCard
              width={SCREEN_WIDTH}
              azoraScore={azoraEstimate.score}
              tierLabel={azoraTier.label}
              ringColors={azoraTier.ringColors}
              onBackgroundDisplay={() => setShareArtifactReady(true)}
            />
          </ViewShot>
        </View>
      </View>

      <AzoraScoreInfoDialog
        visible={infoVisible}
        onClose={() => setInfoVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  bgGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  screenInner: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: spacing['5xl'],
  },

  offscreenArtifactWrap: {
    position: 'absolute',
    left: -10000,
    top: 0,
    opacity: 0,
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
    ...typography.title.title2,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontWeight: '500',
  },

  heroCardWrap: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: spacing.lg,
  },
  heroCard: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  benchmarkCard: {
    ...card.base,
    ...card.shadow,
    marginTop: spacing.lg,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  benchmarkIconWrap: {
    marginTop: 2,
  },
  benchmarkSentence: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    flex: 1,
    lineHeight: 20,
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
  shareDisabled: {
    opacity: 0.5,
  },
  statsHeader: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.resultSection,
    marginBottom: spacing.sm,
  },
  tileRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: padding.screen.horizontal,
  },

  heartHealthCard: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: spacing.sm,
  },
});
