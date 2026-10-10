import { useCompletionSound } from '../hooks/useCompletionSound';
import { useCompletionHaptic } from '../hooks/useCompletionHaptic';
import { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ActivityRewardScreenProps, RootStackParamList } from '../app/navigation';
import { useAfterScreenClosed } from '../app/navigation/useAfterScreenClosed';
import { useOpeningTransitionComplete } from '../app/navigation/useOpeningTransitionComplete';
import { useCloseOntoHome } from '../app/navigation/useCloseOntoHome';
import ChunkyButton, { CHUNKY_TONE_QUIET } from '../components/common/ChunkyButton';
import CoinFlightLayer from '../components/common/CoinFlightLayer';
import EarnedCoinBalance from '../components/common/EarnedCoinBalance';
import GlassIconButton from '../components/common/GlassIconButton';
import { EarnedCoinsCard } from '../components/common/HeaderStripStatCard';
import { Land } from '../components/common/Reveal';
import ScreenContent from '../components/common/ScreenContent';
import ActivityCompletionContent from '../features/plan/ActivityCompletionContent';
import { getActivityResultCopy } from '../features/plan/activityResultCopy';
import { useShareActivityResult } from '../features/plan/useShareActivityResult';
import { useTodoClaimReward } from '../features/plan/useTodoClaimReward';
import { REWARD_BEAT, rewardCardEnterAt } from '../features/plan/rewardEntrance';
import { handDayCompleteToHome } from '../features/room/homeDayCompleteHandoff';
import { useFirstWinOfDayStore } from '../features/selfCare/firstWinOfDayStore';
import { useTourStore } from '../features/tour/tourStore';
import { useCoinRewardFlight } from '../hooks/useCoinRewardFlight';
import { useAuthStore } from '../stores/authStore';
import { colors } from '../theme/colors';
import { padding, spacing } from '../theme/spacing';

const COIN_CARD_WIDTH = 128;
const SHARE_BUTTON_SIZE = 44;

/**
 * The coins a plan lesson, check-in or Reset earned, flown into the balance.
 *
 * It replaces the screen that earned them, so whatever that screen held for its
 * close — the streak popup, the end of the tour, the finished day — is let go
 * when this one leaves instead.
 */
export default function ActivityRewardScreen({
  navigation,
  route,
}: ActivityRewardScreenProps) {
  const openingTransitionComplete = useOpeningTransitionComplete(navigation);
  if ('claim' in route.params) {
    const request = route.params.claim;
    return <TodoClaimReward
      key={`${request.userId}:${request.enrollmentId}:${request.localDate}:${request.programDay}`}
      navigation={navigation}
      request={request}
    />;
  }
  return <ConfirmedActivityReward navigation={navigation} params={route.params} openingTransitionComplete={openingTransitionComplete} />;
}

function TodoClaimReward({ navigation, request }: {
  navigation: ActivityRewardScreenProps['navigation'];
  request: Extract<RootStackParamList['ActivityReward'], { claim: unknown }>['claim'];
}) {
  const claim = useTodoClaimReward(request);
  const insets = useSafeAreaInsets();
  if (claim.response != null) {
    return <ConfirmedActivityReward
      navigation={navigation}
      params={{ kind: 'todo', coins: claim.response.coinsAwarded }}
      resolveDayCompleteUnitId={claim.getDayCompleteUnitId}
      openingTransitionComplete
    />;
  }
  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.md }]}>
      <ActivityCompletionContent
        title={claim.failed ? 'Let’s try that again' : 'Finishing your habit…'}
        subtitle={claim.failed ? 'Your reward hasn’t been confirmed yet.' : 'Saving your progress.'}
        pose="proud"
      >
        {!claim.failed && <ActivityIndicator size="small" color={colors.primary.blue500} />}
      </ActivityCompletionContent>
      <ScreenContent style={styles.footer}>
        {claim.failed && claim.canRetry && <ChunkyButton label="Try again" shape="card" onPress={() => { void claim.retry(); }} />}
        <ChunkyButton label="Back" shape="card" tone={CHUNKY_TONE_QUIET} onPress={() => navigation.goBack()} />
      </ScreenContent>
    </View>
  );
}

function ConfirmedActivityReward({ navigation, params, resolveDayCompleteUnitId, openingTransitionComplete }: {
  navigation: ActivityRewardScreenProps['navigation'];
  params: Exclude<RootStackParamList['ActivityReward'], { claim: unknown }>;
  resolveDayCompleteUnitId?: () => string | undefined;
  openingTransitionComplete: boolean;
}) {
  useCompletionSound('activity', { autoPlay: openingTransitionComplete });
  useCompletionHaptic('activity', openingTransitionComplete);
  const { kind, coins, dayCompleteUnitId } = params;
  const resultCopy = getActivityResultCopy(kind);
  const handleShare = useShareActivityResult(resultCopy.shareMessage);
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const reducedMotion = useReducedMotion();
  const flight = useCoinRewardFlight({ coins, landedAfterMs: rewardCardEnterAt(0) });
  const closeOntoHome = useCloseOntoHome(navigation);
  const leaving = useRef(false);

  useAfterScreenClosed(navigation, () => {
    if (kind === 'lesson') useTourStore.getState().endHandoff(true);
    useFirstWinOfDayStore.getState().revealAfterClose();
  });

  const onContinue = useCallback(() => {
    if (leaving.current) return;
    leaving.current = true;
    const completedUnitId = resolveDayCompleteUnitId == null ? dayCompleteUnitId : resolveDayCompleteUnitId();
    if (completedUnitId != null) {
      handDayCompleteToHome(completedUnitId);
      closeOntoHome();
      return;
    }
    navigation.goBack();
  }, [closeOntoHome, dayCompleteUnitId, navigation, resolveDayCompleteUnitId]);

  // Back is Continue, so a finished day still reaches Home.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onContinue();
      return true;
    });
    return () => subscription.remove();
  }, [onContinue]);

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.md },
      ]}
    >
      <ScreenContent style={styles.topBar}>
        <GlassIconButton
          accessibilityLabel="Share result"
          size={SHARE_BUTTON_SIZE}
          onPress={handleShare}
        >
          <MaterialCommunityIcons
            name="share-variant"
            size={20}
            color={colors.primary.blue500}
          />
        </GlassIconButton>
        <View ref={flight.balanceRef} collapsable={false}>
          <EarnedCoinBalance
            userId={userId}
            coins={coins}
            earnedShown={flight.earnedShown}
          />
        </View>
      </ScreenContent>

      <ActivityCompletionContent
        title={resultCopy.title}
        subtitle={resultCopy.subtitle}
        pose={kind === 'lesson' ? 'excited' : 'proud'}
      >
        <View style={styles.card}>
          <EarnedCoinsCard
            ref={flight.sourceRef}
            coins={flight.cardCoins}
            finalCoins={coins}
            enterAt={reducedMotion ? undefined : rewardCardEnterAt(0)}
            sparkleRing
          />
        </View>
      </ActivityCompletionContent>

      <ScreenContent style={styles.footer}>
        <Land delay={REWARD_BEAT.cta}>
          <ChunkyButton label="Continue" shape="card" onPress={onContinue} />
        </Land>
      </ScreenContent>

      <CoinFlightLayer
        ref={flight.flightRef}
        targetRef={flight.balanceRef}
        onReady={flight.onFlightReady}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: padding.screen.horizontal,
  },
  card: {
    width: COIN_CARD_WIDTH,
  },
  footer: {
    paddingHorizontal: padding.screen.horizontal,
    gap: spacing.sm,
  },
});
