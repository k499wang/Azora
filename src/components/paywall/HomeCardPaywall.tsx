import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useAnimationReduceMotion } from '../../hooks/useReducedMotionSetting';
import { usePaywall } from '../../hooks/usePaywall';
import { startUiTimer } from '../../lib/ui/uiThreadTimer';
import { singlePackage } from '../../lib/paywall/singlePackage';
import { trialDaysFromLabel } from '../../lib/paywall/trialReminder';
import { PaywallPlacement, type PaywallPackageOption } from '../../services/paywall';
import { useExitOfferStore } from '../../stores/exitOfferStore';
import { useHomeCardPaywallStore, type HomeCardPaywallRequest } from '../../stores/homeCardPaywallStore';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import CloseButton from '../common/CloseButton';
import LockedScrim from '../common/LockedScrim';
import { Text } from '../common/Text';
import OnboardingPrimaryButton from '../onboarding/OnboardingPrimaryButton';
import { PaywallFooterLinks } from './PaywallFooterLinks';
import { PlanPriceTerms } from './PlanPriceTerms';

const APP_ICON = require('../../../assets/app/icon.png');

const APP_ICON_SIZE = 52;
const CARD_MAX_WIDTH = 480;
const SCRIM_INTENSITY = 60;
const FADE_MS = 240;
const CLOSE_REVEAL_MS = 5_000;

interface HomeCardProps {
  request: HomeCardPaywallRequest;
  pkg: PaywallPackageOption | null;
  isPurchasing: boolean;
  isRestoring: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  canClose: boolean;
  onPurchase: () => void;
  onRestore: () => void;
  onRetry: () => void;
  onClose: () => void;
}

function HomeCard({
  request,
  pkg,
  isPurchasing,
  isRestoring,
  isLoading,
  errorMessage,
  canClose,
  onPurchase,
  onRestore,
  onRetry,
  onClose,
}: HomeCardProps) {
  const reduceMotion = useAnimationReduceMotion();
  const isBusy = isLoading || isPurchasing || isRestoring;
  const trialDays = pkg?.trialLabel != null
    ? pkg.trialDays ?? trialDaysFromLabel(pkg.trialLabel)
    : pkg?.introOffer?.days;

  return (
    <Animated.View
      accessibilityViewIsModal
      entering={FadeIn.duration(FADE_MS).reduceMotion(reduceMotion)}
      exiting={FadeOut.duration(FADE_MS).reduceMotion(reduceMotion)}
      style={styles.overlay}
    >
      <LockedScrim intensity={SCRIM_INTENSITY} pointerEvents="auto" />
      <View style={styles.card}>
        {canClose ? (
          <CloseButton
            accessibilityLabel="Continue with limits"
            onPress={() => { if (!isBusy) onClose(); }}
            style={styles.close}
          />
        ) : null}
        <View style={styles.header}>
          <Image source={APP_ICON} style={styles.appIcon} contentFit="cover" accessible={false} />
          <Text style={styles.title} numberOfLines={2}>
            {request.name != null ? `Welcome ${request.name}` : 'Welcome'}
          </Text>
        </View>
        <Text style={styles.body}>We’re ready for you.</Text>
        <Text style={styles.body}>
          {request.goalPhrase != null ? `You’re here to ${request.goalPhrase}.` : 'You’re here for a change.'}
          {' That’s what Azora is made for.'}
        </Text>
        <Text style={styles.body}>Every answer has shaped what’s waiting.</Text>
        <Text style={styles.muted}>
          Let us show you what we’ve built for you. No commitment, cancel anytime.
        </Text>
        <OnboardingPrimaryButton
          label={trialDays != null ? `Redeem ${trialDays}-day trial` : 'Subscribe'}
          onPress={onPurchase}
          loading={isPurchasing}
          disabled={isBusy || pkg == null}
        />
        {pkg != null ? <PlanPriceTerms pkg={pkg} largePrice /> : null}
        {pkg == null && isLoading ? <ActivityIndicator color={colors.primary.blue500} /> : null}
        {errorMessage != null ? (
          <Pressable accessibilityRole="button" disabled={isBusy} onPress={onRetry}>
            <Text accessibilityRole="alert" style={styles.error}>{errorMessage} Tap to retry.</Text>
          </Pressable>
        ) : null}
        <PaywallFooterLinks isRestoring={isRestoring} restoreDisabled={isBusy} onRestore={onRestore} />
      </View>
    </Animated.View>
  );
}

function LiveHomeCard({ request }: { request: HomeCardPaywallRequest }) {
  const clear = useHomeCardPaywallStore((state) => state.clear);
  const setExitOfferPending = useExitOfferStore((state) => state.setPending);
  const paywall = usePaywall({
    placement: PaywallPlacement.OnboardingComplete,
    sourceScreen: 'home_card',
  });
  const pkg = singlePackage(paywall.offering);
  const canCloseEventually = (paywall.offering?.paywallMode ?? 'soft') !== 'hard';
  // On a soft paywall the way out waits a few seconds, so the offer is read first.
  const [closeRevealed, setCloseRevealed] = useState(false);
  useEffect(() => {
    if (!canCloseEventually || closeRevealed) return undefined;
    return startUiTimer(CLOSE_REVEAL_MS, () => setCloseRevealed(true));
  }, [canCloseEventually, closeRevealed]);

  return (
    <HomeCard
      request={request}
      pkg={pkg}
      isPurchasing={paywall.isPurchasing}
      isRestoring={paywall.isRestoring}
      isLoading={paywall.isLoading}
      errorMessage={paywall.errorMessage}
      canClose={canCloseEventually && closeRevealed}
      onPurchase={() => {
        if (pkg == null) return;
        void paywall.purchaseSelectedPackage(pkg.id).then((result) => {
          if (result.status === 'purchased' && result.isPro) clear();
        });
      }}
      onRestore={() => {
        void paywall.restorePurchases().then((result) => {
          if (result.status === 'restored' && result.isPro) clear();
        });
      }}
      onRetry={() => { void paywall.retryRevenueCatSync(); }}
      onClose={() => {
        paywall.trackDismissed();
        setExitOfferPending(true);
        clear();
      }}
    />
  );
}

function PreviewHomeCard({ request, pkg }: { request: HomeCardPaywallRequest; pkg: PaywallPackageOption }) {
  const clear = useHomeCardPaywallStore((state) => state.clear);
  return (
    <HomeCard
      request={request}
      pkg={pkg}
      isPurchasing={false}
      isRestoring={false}
      isLoading={false}
      errorMessage={null}
      canClose
      onPurchase={clear}
      onRestore={clear}
      onRetry={clear}
      onClose={clear}
    />
  );
}

/** The whole paywall as one card over a blurred Home; buying it starts the tour. */
export function HomeCardPaywall({ request }: { request: HomeCardPaywallRequest }) {
  return request.preview != null
    ? <PreviewHomeCard request={request} pkg={request.preview.pkg} />
    : <LiveHomeCard request={request} />;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    ...card.base,
    ...card.shadowModal,
    alignSelf: 'center',
    width: '100%',
    maxWidth: CARD_MAX_WIDTH,
    gap: spacing.md,
    padding: spacing.xl,
  },
  close: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingRight: spacing.xl,
  },
  appIcon: {
    width: APP_ICON_SIZE,
    height: APP_ICON_SIZE,
    borderRadius: radius.small,
  },
  title: {
    ...typography.title.title3,
    flex: 1,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  body: {
    ...typography.body.large,
    color: colors.text.primary,
  },
  muted: {
    ...typography.body.large,
    color: colors.text.secondary,
  },
  error: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
