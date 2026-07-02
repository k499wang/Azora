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
import HeartRateStatsSection from '../components/heartRate/HeartRateStatsSection';
import ShareCard from '../components/exercise/ShareCard';
import ScoreRing from '../components/exercise/ScoreRing';
import GlassIconButton from '../components/common/GlassIconButton';
import type { DailyResultScreenProps } from '../app/navigation';
import { estimateAzoraScore, azoraScoreFill, azoraTierMeta } from '../lib/azoraScore';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { trackFeatureGateHit } from '../services/analytics/tracking';
import { PaywallPlacement } from '../services/paywall';
import { FeatureKey } from '../services/subscriptions/featureAccess';
import { useAuthStore } from '../stores/authStore';
import { useProfileQuery } from '../queries/profile/useProfileQuery';

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
            caption="Azora Score"
            captionPosition="bottom"
            captionTextTransform="none"
            gapLabel={null}
          />
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
              emptyChartMessage="Complete your breath hold with heart rate enabled to see your BPM."
              insightContext="breath-hold"
            />
          </View>

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
  statsSection: {
    marginTop: margin.resultSection,
  },
});
