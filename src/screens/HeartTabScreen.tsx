import { Text } from '../components/common/Text';
import { useCallback, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import AppTopBar from '../components/common/AppTopBar';
import GlassIconButton from '../components/common/GlassIconButton';
import Icon from '../components/common/icons/Icon';
import HeartRateStatsSection from '../components/heartRate/HeartRateStatsSection';
import HRVStatsSection from '../components/heartRate/HRVStatsSection';
import RecoveryStatsSection from '../components/heartRate/RecoveryStatsSection';
import { RecentlyLoggedSection } from '../components/heartRate/RecentlyLoggedSection';
import { colors } from '../theme/colors';
import { spacing, padding, margin } from '../theme/spacing';
import { typography, fonts } from '../theme/typography';
import { useAuthStore } from '../stores/authStore';
import { useProfileQuery } from '../queries/profile/useProfileQuery';
import { useHeartRateStatsQuery } from '../queries/tracking/useHeartRateStatsQuery';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { FeatureKey } from '../services/subscriptions/featureAccess';
import { PaywallPlacement } from '../services/paywall';
import { trackFeatureGateHit } from '../services/analytics/tracking';
import { triggerTapHaptic } from '../native/tapHaptics';
import type {
  FeatureAccessResult,
  FeatureKeyValue,
} from '../services/subscriptions/featureAccess';
import type { HeartTabScreenProps } from '../app/navigation';

const MEASURE_BUTTON_SIZE = 48;

export default function HeartTabScreen({ navigation }: HeartTabScreenProps) {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const user = useAuthStore((state) => state.user);
  const heartRateStatsQuery = useHeartRateStatsQuery(user?.id ?? null);
  const profileQuery = useProfileQuery(user?.id ?? null);
  const advancedStatsAccess = useFeatureAccess(FeatureKey.AdvancedStats);

  const stats = heartRateStatsQuery.data;
  const recentHeartRates = stats?.recent ?? [];
  const bpmSamples = stats?.bpmSeries ?? [];
  const ibiMs = stats?.ibiSeries.map((point) => point.ibiMs) ?? [];
  const advancedStatsLocked =
    !advancedStatsAccess.allowed && !advancedStatsAccess.isLoading;
  const partialStatsError =
    stats != null
      ? Object.values(stats.partialErrors).some(Boolean)
      : false;
  const recentHeartRatesError =
    heartRateStatsQuery.isError ||
    (stats?.partialErrors.recent ?? false);
  const showMeasureHint =
    recentHeartRates.length === 0 &&
    !heartRateStatsQuery.isLoading &&
    !recentHeartRatesError;
  const measureHintOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 16, 80],
        outputRange: [1, 1, 0],
        extrapolate: 'clamp',
      }),
    [scrollY],
  );
  const measureHintTranslateY = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 16, 80],
        outputRange: [0, 0, -10],
        extrapolate: 'clamp',
      }),
    [scrollY],
  );
  const onScroll = useMemo(
    () =>
      Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true },
      ),
    [scrollY],
  );
  const hrvSource = stats?.hrvSource;
  const canonicalSession = hrvSource?.session ?? null;
  const openProPaywall = useCallback(
    (
      feature: FeatureKeyValue,
      placement: typeof PaywallPlacement[keyof typeof PaywallPlacement],
      access: FeatureAccessResult,
      sourceAction?: string,
    ) => {
      trackFeatureGateHit({
        feature,
        placement,
        sourceScreen: 'Heart',
        sourceAction,
        access,
      });
      navigation.navigate('ProPaywall', {
        placement,
        sourceScreen: 'Heart',
        sourceAction,
        feature,
      });
    },
    [navigation],
  );

  const openMeasure = useCallback(() => {
    triggerTapHaptic();
    navigation.navigate('HeartRate');
  }, [navigation]);

  return (
    <View style={styles.screen}>
      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical
        overScrollMode="always"
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <AppTopBar
          showAvatar={false}
          rightSlot={<View style={styles.topBarActionPlaceholder} />}
        />

        <View style={styles.statsContent}>
          {partialStatsError || heartRateStatsQuery.isError ? (
            <Text style={styles.partialErrorText}>
              Some stats may be out of date.
            </Text>
          ) : null}

          <RecoveryStatsSection
            stress={canonicalSession == null ? null : stats?.hrv.stress ?? null}
            locked={advancedStatsLocked}
            onPressUpgrade={() =>
              openProPaywall(
                FeatureKey.AdvancedStats,
                PaywallPlacement.DailyResultProGate,
                advancedStatsAccess,
                'recovery_section',
              )
            }
          />

          <HeartRateStatsSection
            hrDrop={canonicalSession == null ? null : stats?.hrv.hrDrop ?? null}
            minBpm={canonicalSession?.minBpm ?? null}
            maxBpm={canonicalSession?.maxBpm ?? null}
            avgBpm={canonicalSession?.avgBpm ?? null}
            age={profileQuery.data?.age ?? null}
            bpmSamples={bpmSamples}
            numberForwardSummary
            locked={advancedStatsLocked}
            onPressUpgrade={() =>
              openProPaywall(
                FeatureKey.AdvancedStats,
                PaywallPlacement.DailyResultProGate,
                advancedStatsAccess,
                'heart_rate_section',
              )
            }
          />

          <HRVStatsSection
            rmssd={stats?.hrv.rmssd ?? null}
            sdnn={stats?.hrv.sdnn ?? null}
            avgBpm={canonicalSession?.avgBpm ?? null}
            ibiMs={ibiMs}
            locked={advancedStatsLocked}
            onPressUpgrade={() =>
              openProPaywall(
                FeatureKey.AdvancedStats,
                PaywallPlacement.DailyResultProGate,
                advancedStatsAccess,
                'hrv_section',
              )
            }
          />

          <RecentlyLoggedSection
            items={recentHeartRates}
            hasError={recentHeartRatesError}
            isLoading={heartRateStatsQuery.isLoading}
          />
        </View>
      </Animated.ScrollView>

      {showMeasureHint ? (
        <Animated.View
          pointerEvents="none"
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[
            styles.measureHintOverlay,
            {
              top: insets.top + spacing.sm,
              opacity: measureHintOpacity,
              transform: [{ translateY: measureHintTranslateY }],
            },
          ]}
        >
          <Text numberOfLines={1} style={styles.measureHintText}>
            Tap the plus to measure
          </Text>
          <Svg
            width={140}
            height={32}
            viewBox="0 0 140 32"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={styles.measureHintArrow}
          >
            <Path
              d="M6 16 H94"
              fill="none"
              stroke={colors.text.brand}
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M88 10 L100 16 L88 22"
              fill="none"
              stroke={colors.text.brand}
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Animated.View>
      ) : null}

      <GlassIconButton
        accessibilityLabel="Measure heart rate"
        onPress={openMeasure}
        size={MEASURE_BUTTON_SIZE}
        style={[styles.stickyAction, { top: insets.top + spacing.xs }]}
        variant="regular"
      >
        <Icon name="plus" size={26} color={colors.text.secondary} />
      </GlassIconButton>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: spacing['7xl'] + spacing.xl,
  },
  statsContent: {
    paddingTop: spacing.md,
    gap: margin.sectionGap,
  },
  topBarActionPlaceholder: {
    width: 48,
    height: 48,
  },
  measureHintOverlay: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'flex-end',
  },
  measureHintArrow: {
    width: 140,
    height: 32,
    marginTop: -spacing.xs,
    marginRight: MEASURE_BUTTON_SIZE + spacing.xs,
  },
  stickyAction: {
    position: 'absolute',
    right: spacing.lg,
    zIndex: 2,
    elevation: 2,
  },
  measureHintText: {
    alignSelf: 'stretch',
    paddingRight: MEASURE_BUTTON_SIZE + spacing.sm,
    textAlign: 'right',
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    color: colors.text.brand,
  },
  partialErrorText: {
    color: colors.text.tertiary,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: padding.screen.horizontal,
  },
});
