import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Outfit_200ExtraLight,
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import { Asset } from 'expo-asset';
import {
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { PostHogProvider } from 'posthog-react-native';
import { RootNavigator } from './src/app/navigation';
import type { RootStackParamList } from './src/app/navigation';
import { SUNSET_BACKGROUND } from './src/components/common/SunsetBackground';
import { BACKGROUND_2066 } from './src/components/common/Background2066';
import { AppProviders } from './src/app/providers/AppProviders';
import { posthog } from './src/config/posthog';
import { trackAppOpened, trackScreenView } from './src/services/analytics/tracking';
import { bootstrapAnalytics } from './src/services/analytics/identity';
import { registerAppSessionTracking } from './src/services/analytics/appSession';
import { registerAuthIdentitySync } from './src/services/supabase';
import { initAppsFlyer } from './src/services/attribution/appsFlyerClient';
import { logAppsFlyerDiagnostics } from './src/services/attribution/appsFlyerDiagnostics';
import { isAttPermissionResolved } from './src/services/attribution/attPrompt';
import { WelcomeIntro } from './src/components/welcome/WelcomeIntro';
import { colors } from './src/theme/colors';
import TECHNIQUES from './src/data/techniques';
import { AUTH_LANDING_SLIDES } from './src/data/authLandingSlides';
import { AGREEMENT_STATEMENTS } from './src/components/onboarding/screens/AgreementScreen';
SplashScreen.preventAutoHideAsync();

// ─── Critical background images (awaited before app render) ────────────
const CRITICAL_BG_ASSETS = [SUNSET_BACKGROUND, BACKGROUND_2066];

// ─── Secondary asset preloads (fire-and-forget, non-blocking) ──────────
Asset.fromModule(require('./assets/onboarding/camerappg.png')).downloadAsync();
Asset.fromModule(require('./assets/onboarding/founder-intro-poster.jpg')).downloadAsync();
AUTH_LANDING_SLIDES.forEach((slide) => {
  Asset.fromModule(slide.source as number).downloadAsync();
});
TECHNIQUES.forEach((technique) => {
  Asset.fromModule(technique.backgroundImage as number).downloadAsync();
});
AGREEMENT_STATEMENTS.forEach((statement) => {
  if (statement.image) {
    Asset.fromModule(statement.image as number).downloadAsync();
  }
});

const navigationRef = createNavigationContainerRef<RootStackParamList>();
const STARTUP_BACKGROUND_COLOR = colors.orange[500];

export default function App() {
  const [fontsLoaded] = useFonts({
    'Outfit-ExtraLight': Outfit_200ExtraLight,
    'Outfit-Light': Outfit_300Light,
    'Outfit-Regular': Outfit_400Regular,
    'Outfit-Medium': Outfit_500Medium,
    'Outfit-SemiBold': Outfit_600SemiBold,
    'Outfit-Bold': Outfit_700Bold,
  });

  const [criticalAssetsReady, setCriticalAssetsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function preload() {
      try {
        await Asset.loadAsync(CRITICAL_BG_ASSETS);
      } catch {
        // proceed even on failure — worst case the image loads on-screen
      }
      if (!cancelled) setCriticalAssetsReady(true);
    }
    preload();
    return () => { cancelled = true; };
  }, []);

  const appReady = fontsLoaded && criticalAssetsReady;

  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      await SplashScreen.hideAsync();
    }
  }, [appReady]);

  const lastTrackedRouteNameRef = useRef<string | null>(null);

  useEffect(() => {
    if (!fontsLoaded) return;
    let cancelled = false;
    bootstrapAnalytics();
    void isAttPermissionResolved().then((isResolved) => {
      if (cancelled || !isResolved) return;
      void initAppsFlyer().then(() => {
        if (!cancelled) void logAppsFlyerDiagnostics();
      });
    });
    trackAppOpened();
    const unsubscribeSessionTracking = registerAppSessionTracking();
    const unsubscribeAuthIdentitySync = registerAuthIdentitySync();
    return () => {
      cancelled = true;
      unsubscribeSessionTracking();
      unsubscribeAuthIdentitySync();
    };
  }, [fontsLoaded]);

  const trackCurrentScreen = useCallback(() => {
    if (!navigationRef.isReady()) return;

    const currentRoute = navigationRef.getCurrentRoute();
    if (currentRoute == null) return;

    if (lastTrackedRouteNameRef.current === currentRoute.name) return;

    lastTrackedRouteNameRef.current = currentRoute.name;
    trackScreenView(currentRoute);
  }, []);

  const [introVisible, setIntroVisible] = useState(true);

  if (!appReady) {
    return <View style={{ flex: 1, backgroundColor: STARTUP_BACKGROUND_COLOR }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <View
          style={{ flex: 1, backgroundColor: STARTUP_BACKGROUND_COLOR }}
          onLayout={onLayoutRootView}
        >
          <NavigationContainer
            ref={navigationRef}
            onReady={trackCurrentScreen}
            onStateChange={trackCurrentScreen}
          >
            <PostHogProvider client={posthog} autocapture={{ captureTouches: false, captureScreens: false }}>
              <AppProviders>
                <RootNavigator allowBootPaywall={!introVisible} />
              </AppProviders>
            </PostHogProvider>
          </NavigationContainer>
          {introVisible ? (
            <WelcomeIntro onFinish={() => setIntroVisible(false)} />
          ) : null}

          {/* Hidden preloaders — force React Native to decode + cache these
              images so they appear instantly on result screens. */}
          <View
            style={{
              position: 'absolute',
              width: 0,
              height: 0,
              overflow: 'hidden',
              opacity: 0,
            }}
            pointerEvents="none"
          >
            {CRITICAL_BG_ASSETS.map((src, i) => (
              <Image
                key={i}
                source={src}
                style={{ width: 1, height: 1 }}
                cachePolicy="memory-disk"
                transition={0}
              />
            ))}
          </View>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
