import { useCallback, useRef } from 'react';
import { Alert, Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
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
import BPMChart from '../components/home/BPMChart';
import ShareCard from '../components/exercise/ShareCard';
import BiologicalAgeRing from '../components/exercise/BiologicalAgeRing';
import SectionHeader from '../components/common/SectionHeader';
import ThermometerStatCard from '../components/home/ThermometerStatCard';
import GlassIconButton from '../components/common/GlassIconButton';
import type { DailyResultScreenProps } from '../app/navigation';
import { estimateLungAge } from '../lib/lungAge';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
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
  const lungEstimate = estimateLungAge({ holdSeconds, avgBpm, minBpm });
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
  const handleShare = useCallback(async () => {
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
  }, []);
  const showAdvancedStatsPaywall = useCallback(() => {
    navigation.navigate('ProPaywall', {
      placement: PaywallPlacement.DailyResultProGate,
      sourceScreen: 'DailyResult',
      feature: FeatureKey.AdvancedStats,
    });
  }, [navigation]);

  const renderHeroCard = () => (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>Nice work!</Text>
      </View>

      <View style={styles.heroCardWrap}>
        <View style={styles.heroCard}>
          <BiologicalAgeRing
            lungAge={lungEstimate.age}
            userAge={userAge}
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
      <Image
        source={require('../../assets/backgrounds/2066.jpg')}
        style={styles.bgImage}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={0}
      />
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

          <Pressable style={styles.shareCta} onPress={handleShare}>
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
              lungAge={lungEstimate.age}
              userAge={userAge}
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
