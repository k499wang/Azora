import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
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
import { AppProviders } from './src/app/providers/AppProviders';
import { posthog } from './src/config/posthog';
import { trackAppOpened, trackScreenView } from './src/services/analytics/tracking';
import { bootstrapAnalytics } from './src/services/analytics/identity';
import { registerAppSessionTracking } from './src/services/analytics/appSession';
import { registerAuthIdentitySync } from './src/services/supabase';
import { initAppsFlyer } from './src/services/attribution/appsFlyerClient';
import { logAppsFlyerDiagnostics } from './src/services/attribution/appsFlyerDiagnostics';
import { WelcomeIntro } from './src/components/welcome/WelcomeIntro';
import { colors } from './src/theme/colors';
import TECHNIQUES from './src/features/exercise/guidedBreathing/techniques';
import { AUTH_LANDING_SLIDES } from './src/data/authLandingSlides';
import { loadCriticalBackgroundImages } from './src/services/images/backgroundImageCache';
SplashScreen.preventAutoHideAsync();

// ─── Secondary asset preloads (fire-and-forget, non-blocking) ──────────
AUTH_LANDING_SLIDES.forEach((slide) => {
  Asset.fromModule(slide.source as number).downloadAsync();
});
TECHNIQUES.forEach((technique) => {
  Asset.fromModule(technique.backgroundImage as number).downloadAsync();
});
const navigationRef = createNavigationContainerRef<RootStackParamList>();
const STARTUP_BACKGROUND_COLOR = colors.neutral[0];

export default function App() {
  const [fontsLoaded] = useFonts({
    'Outfit-ExtraLight': Outfit_200ExtraLight,
    'Outfit-Light': Outfit_300Light,
    'Outfit-Regular': Outfit_400Regular,
    'Outfit-Medium': Outfit_500Medium,
    'Outfit-SemiBold': Outfit_600SemiBold,
    'Outfit-Bold': Outfit_700Bold,
  });
  const [backgroundImagesReady, setBackgroundImagesReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadCriticalBackgroundImages().then(() => {
      if (!cancelled) setBackgroundImagesReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const appReady = fontsLoaded && backgroundImagesReady;

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
    void initAppsFlyer().then(() => {
      if (!cancelled) void logAppsFlyerDiagnostics();
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
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
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
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
