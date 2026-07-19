import { Text } from '../components/common/Text';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { Background2066 } from '../components/common/Background2066';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { spacing, padding, margin } from '../theme/spacing';
import { typography, fonts } from '../theme/typography';
import { HeartRateResultContent } from '../components/heartRate/HeartRateResultContent';
import { useAuthStore } from '../stores/authStore';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { trackFeatureGateHit } from '../services/analytics/tracking';
import { useHeartRateSessionDetailQuery } from '../queries/tracking/useHeartRateSessionDetailQuery';
import { useProfileQuery } from '../queries/profile/useProfileQuery';
import { PaywallPlacement } from '../services/paywall';
import { FeatureKey } from '../services/subscriptions/featureAccess';
import type { HeartRateSessionDetailScreenProps } from '../app/navigation';
import GlassIconButton from '../components/common/GlassIconButton';

export function HeartRateSessionDetailScreen({
  navigation,
  route,
}: HeartRateSessionDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const sessionId = route.params.sessionId;
  const detailQuery = useHeartRateSessionDetailQuery(user?.id ?? null, sessionId);
  const profileQuery = useProfileQuery(user?.id ?? null);
  const advancedStatsAccess = useFeatureAccess(FeatureKey.AdvancedStats);
  const detail = detailQuery.data ?? null;
  const advancedStatsLocked =
    !advancedStatsAccess.allowed && !advancedStatsAccess.isLoading;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
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
                showHrv={detail.mode !== 'quick'}
                showRestingHealthBar={detail.mode === 'quick'}
                age={profileQuery.data?.age ?? null}
                rmssd={detail.rmssd}
                sdnn={detail.sdnn}
                stress={detail.stress}
                bpmSamples={detail.bpmSeries}
                ibiSamples={detail.ibiSeries}
                advancedStatsLocked={advancedStatsLocked}
                onPressUpgrade={() => {
                  trackFeatureGateHit({
                    feature: FeatureKey.AdvancedStats,
                    placement: PaywallPlacement.DailyResultProGate,
                    sourceScreen: 'HeartRateSessionDetail',
                    sourceAction: 'session_detail_stats',
                    access: advancedStatsAccess,
                  });
                  navigation.navigate('ProPaywall', {
                    placement: PaywallPlacement.DailyResultProGate,
                    sourceScreen: 'HeartRateSessionDetail',
                    sourceAction: 'session_detail_stats',
                    feature: FeatureKey.AdvancedStats,
                  });
                }}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Glassmorphic close button — fixed above the scroll */}
      <GlassIconButton
        style={[styles.closeButton, { top: insets.top + padding.screen.vertical }]}
        onPress={() => navigation.goBack()}
      >
        <MaterialCommunityIcons name="close" size={22} color={colors.text.secondary} />
      </GlassIconButton>
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
  headerTitle: {
    ...typography.title.title1,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    fontWeight: '500',
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
