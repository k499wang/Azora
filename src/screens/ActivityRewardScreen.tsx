import { useCompletionSound } from '../hooks/useCompletionSound';
import { useCompletionHaptic } from '../hooks/useCompletionHaptic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
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
import StatChip from '../components/common/StatChip';
import TaskIllustration from '../components/common/icons/TaskIllustration';
import ActivityCompletionContent from '../features/plan/ActivityCompletionContent';
import { getActivityResultCopy } from '../features/plan/activityResultCopy';
import { useShareActivityResult } from '../features/plan/useShareActivityResult';
import { useTodoClaimReward } from '../features/plan/useTodoClaimReward';
import { useTodoClaimRewardPreview } from '../features/plan/useTodoClaimRewardPreview';
import { REWARD_BEAT, rewardCardEnterAt } from '../features/plan/rewardEntrance';
import { handDayCompleteToHome } from '../features/room/homeDayCompleteHandoff';
import { useFirstWinOfDayStore } from '../features/selfCare/firstWinOfDayStore';
import { useTourStore } from '../features/tour/tourStore';
import { useCoinRewardFlight } from '../hooks/useCoinRewardFlight';
import { useAuthStore } from '../stores/authStore';
import { colors } from '../theme/colors';
import { padding, spacing } from '../theme/spacing';
import { EARN_RATES } from '../lib/wallet/coins';

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
  const isPreview = 'previewClaim' in route.params;
  useEffect(() => {
    if (isPreview && !__DEV__) navigation.goBack();
  }, [isPreview, navigation]);
  if ('previewClaim' in route.params) {
    if (!__DEV__) return null;
    return <TodoClaimRewardPreview navigation={navigation} mode={route.params.previewClaim} openingTransitionComplete={openingTransitionComplete} />;
  }
  if ('claim' in route.params) {
    const request = route.params.claim;
    return <TodoClaimReward
      key={`${request.userId}:${request.enrollmentId}:${request.localDate}:${request.programDay}`}
      navigation={navigation}
      request={request}
      openingTransitionComplete={openingTransitionComplete}
    />;
  }
  return <ActivityRewardContent navigation={navigation} params={route.params} openingTransitionComplete={openingTransitionComplete} />;
}

function TodoClaimRewardPreview({ navigation, mode, openingTransitionComplete }: {
  navigation: ActivityRewardScreenProps['navigation'];
  mode: Extract<RootStackParamList['ActivityReward'], { previewClaim: unknown }>['previewClaim'];
  openingTransitionComplete: boolean;
}) {
  const claim = useTodoClaimRewardPreview(mode);
  return <ActivityRewardContent
    navigation={navigation}
    params={{ kind: 'todo', coins: claim.response?.coinsAwarded ?? 0 }}
    claim={claim}
    resolveDayCompleteUnitId={claim.getDayCompleteUnitId}
    openingTransitionComplete={openingTransitionComplete}
    preview
  />;
}

function TodoClaimReward({ navigation, request, openingTransitionComplete }: {
  navigation: ActivityRewardScreenProps['navigation'];
  request: Extract<RootStackParamList['ActivityReward'], { claim: unknown }>['claim'];
  openingTransitionComplete: boolean;
}) {
  const claim = useTodoClaimReward(request);
  return <ActivityRewardContent
    navigation={navigation}
    params={{ kind: 'todo', coins: claim.response?.coinsAwarded ?? 0 }}
    claim={claim}
    resolveDayCompleteUnitId={claim.getDayCompleteUnitId}
    openingTransitionComplete={openingTransitionComplete}
  />;
}

function ActivityRewardContent({ navigation, params, claim, resolveDayCompleteUnitId, openingTransitionComplete, preview = false }: {
  navigation: ActivityRewardScreenProps['navigation'];
  params: Extract<RootStackParamList['ActivityReward'], { coins: number }>;
  claim?: ReturnType<typeof useTodoClaimReward>;
  resolveDayCompleteUnitId?: () => string | undefined;
  openingTransitionComplete: boolean;
  preview?: boolean;
}) {
  const [contentReady, setContentReady] = useState(claim == null);
  const onContentReady = useCallback(() => setContentReady(true), []);
  const confirmed = (claim == null || claim.response != null) && contentReady;
  const failed = claim?.response == null && claim?.failed === true;
  const cardVisible = contentReady && !failed;
  useCompletionSound('activity', { autoPlay: confirmed && openingTransitionComplete, active: confirmed });
  useCompletionHaptic('activity', confirmed && openingTransitionComplete);
  const { kind, coins: awardedCoins, dayCompleteUnitId } = params;
  const coins = confirmed ? awardedCoins : 0;
  const resultCopy = getActivityResultCopy(kind);
  const handleShare = useShareActivityResult(resultCopy.shareMessage);
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const reducedMotion = useReducedMotion();
  const cardEnterAt = rewardCardEnterAt(0);
  const flight = useCoinRewardFlight({ coins, landedAfterMs: cardEnterAt });
  // The habit is already done; saving confirms its expected award without restarting the card entrance.
  const cardCoins = claim == null ? flight.cardCoins : claim.response?.coinsAwarded ?? EARN_RATES.todoStep;
  const closeOntoHome = useCloseOntoHome(navigation);
  const leaving = useRef(false);

  useAfterScreenClosed(navigation, () => {
    if (preview) return;
    if (kind === 'lesson') useTourStore.getState().endHandoff(true);
    if (!confirmed) return;
    useFirstWinOfDayStore.getState().revealAfterClose();
  });

  const onContinue = useCallback(() => {
    if (!confirmed || leaving.current) return;
    leaving.current = true;
    if (preview) {
      navigation.goBack();
      return;
    }
    const completedUnitId = resolveDayCompleteUnitId == null ? dayCompleteUnitId : resolveDayCompleteUnitId();
    if (completedUnitId != null) {
      handDayCompleteToHome(completedUnitId);
      closeOntoHome();
      return;
    }
    navigation.goBack();
  }, [closeOntoHome, confirmed, dayCompleteUnitId, navigation, preview, resolveDayCompleteUnitId]);

  // Back is Continue, so a finished day still reaches Home.
  useEffect(() => {
    if (!confirmed) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onContinue();
      return true;
    });
    return () => subscription.remove();
  }, [confirmed, onContinue]);

  const continueButton = <ChunkyButton label="Continue" shape="card" disabled={!confirmed} onPress={onContinue} />;
  const continueAction = claim != null && reducedMotion
    ? <View
      style={!contentReady && styles.hidden}
      pointerEvents={contentReady ? 'auto' : 'none'}
      accessibilityElementsHidden={!contentReady}
      importantForAccessibility={contentReady ? 'auto' : 'no-hide-descendants'}
    >{continueButton}</View>
    : <Land delay={REWARD_BEAT.cta} when={claim == null || contentReady}>{continueButton}</Land>;

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.md },
      ]}
    >
      <ScreenContent style={styles.topBar}>
        <View style={styles.shareSlot}>
          {contentReady && !failed && !preview && <GlassIconButton
            accessibilityLabel="Share result"
            size={SHARE_BUTTON_SIZE}
            onPress={handleShare}
          >
            <MaterialCommunityIcons
              name="share-variant"
              size={20}
              color={colors.primary.blue500}
            />
          </GlassIconButton>}
        </View>
        <View ref={flight.balanceRef} collapsable={false}>
          {preview ? <StatChip
            mark={<TaskIllustration name="coin" size={24} />}
            value={100 + (flight.earnedShown ? coins : 0)}
            accessibilityLabel="Preview coin balance"
            size="compact"
          /> : <EarnedCoinBalance
            userId={userId}
            coins={awardedCoins}
            earnedShown={flight.earnedShown}
          />}
        </View>
      </ScreenContent>

      <ActivityCompletionContent
        title={failed ? 'Let’s try that again' : resultCopy.title}
        subtitle={failed ? 'Your reward hasn’t been confirmed yet.' : resultCopy.subtitle}
        pose={kind === 'lesson' ? 'excited' : 'proud'}
        onReady={claim == null ? undefined : onContentReady}
      >
        <View style={styles.card}>
          <View
            style={!cardVisible && styles.hidden}
            accessibilityElementsHidden={!cardVisible}
            importantForAccessibility={cardVisible ? 'auto' : 'no-hide-descendants'}
          >
            <EarnedCoinsCard
              ref={flight.sourceRef}
              coins={cardCoins}
              finalCoins={claim == null ? coins : cardCoins}
              enterAt={contentReady && !reducedMotion ? cardEnterAt : undefined}
              sparkleRing={contentReady}
            />
          </View>
        </View>
      </ActivityCompletionContent>

      <ScreenContent style={styles.footer}>
        {failed && claim?.canRetry && <ChunkyButton label="Try again" shape="card" onPress={() => { void claim.retry(); }} />}
        {failed ? <ChunkyButton label="Back" shape="card" tone={CHUNKY_TONE_QUIET} onPress={() => navigation.goBack()} /> : continueAction}
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
  shareSlot: {
    width: SHARE_BUTTON_SIZE,
    height: SHARE_BUTTON_SIZE,
  },
  hidden: {
    opacity: 0,
  },
  footer: {
    paddingHorizontal: padding.screen.horizontal,
    gap: spacing.sm,
  },
});
