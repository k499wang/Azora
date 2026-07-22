import { useEffect, useRef, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, View } from 'react-native';
import { BrandSplash } from '../../components/welcome/BrandSplash';
import AuthLandingScreen from '../../screens/AuthLandingScreen';
import DailyBreathHoldScreen from '../../features/exercise/dailyBreathHold/DailyBreathHoldScreen';
import GuidedBreathingSessionScreen from '../../features/exercise/guidedBreathing/GuidedBreathingSessionScreen';
import SessionCompleteScreen from '../../screens/SessionCompleteScreen';
import { HeartRateScreen } from '../../screens/HeartRateScreen';
import { HeartRateSessionDetailScreen } from '../../screens/HeartRateSessionDetailScreen';
import { ProPaywallScreen } from '../../screens/ProPaywallScreen';
import { ExitOfferScreen } from '../../screens/ExitOfferScreen';
import SettingsScreen from '../../screens/SettingsScreen';
import ShareableResultScreen from '../../screens/ShareableResultScreen';
import { useAppGate, type AppGate } from '../../hooks/useAppGate';
import {
  isAttPermissionResolved,
  requestAttPermissionOnce,
} from '../../services/attribution/attPrompt';
import { initAppsFlyer } from '../../services/attribution/appsFlyerClient';
import { logAppsFlyerDiagnostics } from '../../services/attribution/appsFlyerDiagnostics';
import { useUserEntitlementQuery } from '../../queries/subscriptions/useUserEntitlementQuery';
import { OnboardingFlow } from '../../components/onboarding';
import AmbientBackground from '../../components/common/AmbientBackground';
import { PaywallPlacement } from '../../services/paywall';
import { getPaywallOffering, type PaywallMode } from '../../services/paywall';
import {
  ensureRevenueCatIdentityForCurrentUser,
  syncRevenueCatAttributionForCurrentUser,
} from '../../services/subscriptions/revenueCatIdentitySync';
import { useAuthStore } from '../../stores/authStore';
import { useExitOfferStore } from '../../stores/exitOfferStore';
import { useRevenueCatIdentityStore } from '../../stores/revenueCatIdentityStore';
import { loadCriticalOnboardingImages } from '../../services/images/onboardingImageCache';
import { colors } from '../../theme/colors';
import { MainTabs } from './MainTabs';
import type { RootStackNavigationProp, RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
type OnboardingGate = Extract<AppGate, { status: 'needs_onboarding' }>;
type LastStableGateStatus = 'signed_out' | 'needs_onboarding' | 'ready' | null;

interface AppStackProps {
  showBootPaywall: boolean;
}

function AppStack({ showBootPaywall }: AppStackProps) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs">
        {() => <MainTabsRoute showBootPaywall={showBootPaywall} />}
      </Stack.Screen>
      <Stack.Screen
        name="HeartRate"
        component={HeartRateScreen}
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="ProPaywall"
        component={ProPaywallScreen}
        options={{
          presentation: 'transparentModal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="ExitOffer"
        component={ExitOfferScreen}
        options={{
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
          gestureEnabled: true,
          gestureDirection: 'vertical',
        }}
      />
      <Stack.Screen
        name="HeartRateSessionDetail"
        component={HeartRateSessionDetailScreen}
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="ExerciseSession"
        component={GuidedBreathingSessionScreen}
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="SessionComplete"
        component={SessionCompleteScreen}
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="DailyExercise"
        component={DailyBreathHoldScreen}
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="DailyResult"
        component={ShareableResultScreen}
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
}

function MainTabsRoute({ showBootPaywall }: AppStackProps) {
  // Capture once at mount: a pending exit offer takes precedence over the boot
  // paywall so the just-onboarded user never sees both.
  const exitOfferPending = useRef(useExitOfferStore.getState().pending).current;

  return (
    <>
      {exitOfferPending ? <ExitOfferPresenter /> : null}
      <MainTabs />
      {/* After MainTabs so the boot paywall can present over the app. */}
      {!exitOfferPending && showBootPaywall ? <BootPaywallGate /> : null}
    </>
  );
}

// Decides how non-Pro users meet the paywall on boot: hard mode renders a
// blocking full-screen gate; soft mode (or any failure resolving the mode)
// falls back to the dismissible ProPaywall modal.
function BootPaywallGate() {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const entitlementQuery = useUserEntitlementQuery(userId);
  const revenueCatStatus = useRevenueCatIdentityStore((state) => state.status);
  const revenueCatAppUserId = useRevenueCatIdentityStore((state) => state.appUserId);
  const [paywallMode, setPaywallMode] = useState<PaywallMode | null>(null);

  const isPro = entitlementQuery.data?.isPro === true;
  // isFetching matters as much as isPending: this gate mounts right after
  // onboarding finishes, when a just-purchased user's entitlement is still
  // being refetched and the cached value still reads non-Pro.
  const shouldGate =
    userId != null &&
    !entitlementQuery.isPending &&
    !entitlementQuery.isFetching &&
    !entitlementQuery.isError &&
    !isPro;

  useEffect(() => {
    if (!shouldGate || paywallMode != null) return;

    if (
      revenueCatStatus === 'unavailable' ||
      revenueCatStatus === 'failed' ||
      revenueCatStatus === 'signed_out'
    ) {
      setPaywallMode('soft');
      return;
    }

    if (revenueCatStatus !== 'synced' || revenueCatAppUserId !== userId) {
      // Identity still syncing — fail soft if it doesn't settle so non-Pro
      // users are never left with no paywall at all.
      void ensureRevenueCatIdentityForCurrentUser();
      const id = setTimeout(() => setPaywallMode('soft'), 6000);
      return () => clearTimeout(id);
    }

    let isActive = true;
    getPaywallOffering(PaywallPlacement.ProfileUpgrade)
      .then((result) => {
        if (isActive) setPaywallMode(result.offering?.paywallMode ?? 'soft');
      })
      .catch(() => {
        if (isActive) setPaywallMode('soft');
      });
    return () => {
      isActive = false;
    };
  }, [shouldGate, paywallMode, revenueCatStatus, revenueCatAppUserId, userId]);

  if (!shouldGate || paywallMode == null) return null;
  return <BootPaywallPresenter isBlocking={paywallMode === 'hard'} />;
}

function ExitOfferPresenter() {
  const navigation = useNavigation<RootStackNavigationProp<'MainTabs'>>();
  const setPending = useExitOfferStore((state) => state.setPending);
  const hasPresentedRef = useRef(false);

  useEffect(() => {
    if (hasPresentedRef.current) return;
    hasPresentedRef.current = true;

    // Let Home paint first, then slide the offer up over it.
    const id = setTimeout(() => {
      setPending(false);
      navigation.navigate('ExitOffer');
    }, 450);
    return () => clearTimeout(id);
  }, [navigation, setPending]);

  return null;
}

function BootPaywallPresenter({ isBlocking = false }: { isBlocking?: boolean }) {
  const navigation = useNavigation<RootStackNavigationProp<'MainTabs'>>();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const entitlementQuery = useUserEntitlementQuery(userId);
  const hasPresentedRef = useRef(false);

  useEffect(() => {
    if (hasPresentedRef.current) return;
    if (userId == null || entitlementQuery.isPending || entitlementQuery.isError) return;
    if (entitlementQuery.isFetching) return;
    if (entitlementQuery.data?.isPro === true) return;

    hasPresentedRef.current = true;
    navigation.navigate('ProPaywall', {
      placement: PaywallPlacement.ProfileUpgrade,
      sourceScreen: 'RootNavigator',
      sourceAction: 'app_boot',
      isBlocking,
    });
  }, [
    entitlementQuery.data?.isPro,
    entitlementQuery.isError,
    entitlementQuery.isFetching,
    entitlementQuery.isPending,
    isBlocking,
    navigation,
    userId,
  ]);

  return null;
}

// Fallback for users who are already past onboarding with ATT still
// undetermined (installed before the attPriming step existed). Without a
// resolved ATT status the AppsFlyer SDK remains in manual-start mode, so their
// events would otherwise be dropped forever. Mirrors the post-prompt sequence
// in OnboardingFlow's attPriming step.
function AttFallbackPresenter() {
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    void (async () => {
      try {
        if (await isAttPermissionResolved()) return;
        await requestAttPermissionOnce();
        await initAppsFlyer();
        void logAppsFlyerDiagnostics();
        await syncRevenueCatAttributionForCurrentUser();
      } catch {
        // Attribution is best-effort and must never block the app shell.
      }
    })();
  }, []);

  return null;
}

interface RootNavigatorProps {
  allowBootPaywall?: boolean;
}

function OnboardingOverlay({ gate }: { gate: OnboardingGate }) {
  useEffect(() => {
    void loadCriticalOnboardingImages();
  }, []);

  return (
    <View style={styles.overlayRoot}>
      <AppStack showBootPaywall={false} />
      <View style={styles.onboardingOverlay}>
        <AmbientBackground />
        <OnboardingFlow
          initialSavedProfile={gate.savedOnboardingProfile}
          isSavingProfile={gate.isSavingOnboardingProfile}
          isCompletingOnboarding={gate.isCompletingOnboarding}
          onSaveProfile={gate.saveOnboardingProfile}
          onComplete={gate.completeOnboarding}
        />
      </View>
    </View>
  );
}

export function RootNavigator({ allowBootPaywall = true }: RootNavigatorProps) {
  const gate = useAppGate();
  const lastStableGateStatusRef = useRef<LastStableGateStatus>(null);
  const lastOnboardingGateRef = useRef<OnboardingGate | null>(null);

  if (gate.status === 'booting') {
    if (lastOnboardingGateRef.current != null) {
      return <OnboardingOverlay gate={lastOnboardingGateRef.current} />;
    }

    if (lastStableGateStatusRef.current === 'signed_out') {
      return <AuthLandingScreen />;
    }

    return <BrandSplash />;
  }

  if (gate.status === 'signed_out') {
    lastStableGateStatusRef.current = 'signed_out';
    lastOnboardingGateRef.current = null;
    return <AuthLandingScreen />;
  }

  if (gate.status === 'needs_onboarding') {
    lastStableGateStatusRef.current = 'needs_onboarding';
    lastOnboardingGateRef.current = gate;
    return <OnboardingOverlay gate={gate} />;
  }

  lastStableGateStatusRef.current = 'ready';
  lastOnboardingGateRef.current = null;
  return (
    <>
      <AttFallbackPresenter />
      <AppStack showBootPaywall={allowBootPaywall} />
    </>
  );
}

const styles = StyleSheet.create({
  overlayRoot: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  onboardingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.primary,
  },
});
