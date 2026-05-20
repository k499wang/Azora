import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Urbanist_400Regular,
  Urbanist_500Medium,
  Urbanist_600SemiBold,
  Urbanist_700Bold,
} from '@expo-google-fonts/urbanist';
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import {
  Fredoka_600SemiBold,
  Fredoka_700Bold,
} from '@expo-google-fonts/fredoka';
import {
  Baloo2_600SemiBold,
  Baloo2_700Bold,
} from '@expo-google-fonts/baloo-2';
import {
  Unbounded_600SemiBold,
  Unbounded_700Bold,
} from '@expo-google-fonts/unbounded';
import {
  Sniglet_400Regular,
  Sniglet_800ExtraBold,
} from '@expo-google-fonts/sniglet';
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
import { WelcomeIntro } from './src/components/welcome/WelcomeIntro';
import { colors } from './src/theme/colors';
import TECHNIQUES from './src/data/techniques';
import { AGREEMENT_STATEMENTS } from './src/components/onboarding/screens/AgreementScreen';
SplashScreen.preventAutoHideAsync();

Asset.fromModule(require('./assets/backgrounds/sunset.jpg')).downloadAsync();
TECHNIQUES.forEach((technique) => {
  Asset.fromModule(technique.backgroundImage as number).downloadAsync();
});
AGREEMENT_STATEMENTS.forEach((statement) => {
  if (statement.image) {
    Asset.fromModule(statement.image as number).downloadAsync();
  }
});

const navigationRef = createNavigationContainerRef<RootStackParamList>();

export default function App() {
  const [fontsLoaded] = useFonts({
    'Urbanist-Regular': Urbanist_400Regular,
    'Urbanist-Medium': Urbanist_500Medium,
    'Urbanist-SemiBold': Urbanist_600SemiBold,
    'Urbanist-Bold': Urbanist_700Bold,
    'Nunito-Regular': Nunito_400Regular,
    'Nunito-Medium': Nunito_500Medium,
    'Nunito-SemiBold': Nunito_600SemiBold,
    'Nunito-Bold': Nunito_700Bold,
    'Fredoka-SemiBold': Fredoka_600SemiBold,
    'Fredoka-Bold': Fredoka_700Bold,
    'Baloo2-SemiBold': Baloo2_600SemiBold,
    'Baloo2-Bold': Baloo2_700Bold,
    'Unbounded-SemiBold': Unbounded_600SemiBold,
    'Unbounded-Bold': Unbounded_700Bold,
    // Sniglet only ships Regular + ExtraBold; map to consistent -SemiBold/-Bold keys
    'Sniglet-SemiBold': Sniglet_400Regular,
    'Sniglet-Bold': Sniglet_800ExtraBold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  const lastTrackedRouteNameRef = useRef<string | null>(null);

  useEffect(() => {
    if (!fontsLoaded) return;
    bootstrapAnalytics();
    trackAppOpened();
    const unsubscribeSessionTracking = registerAppSessionTracking();
    const unsubscribeAuthIdentitySync = registerAuthIdentitySync();
    return () => {
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

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <StatusBar style="dark" />
      <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
        <NavigationContainer
          ref={navigationRef}
          onReady={trackCurrentScreen}
          onStateChange={trackCurrentScreen}
        >
          <PostHogProvider client={posthog} autocapture={{ captureTouches: false, captureScreens: false }}>
            <AppProviders>
              <RootNavigator />
            </AppProviders>
          </PostHogProvider>
        </NavigationContainer>
        {introVisible ? (
          <WelcomeIntro onFinish={() => setIntroVisible(false)} />
        ) : null}
      </View>
    </SafeAreaProvider>
  );
}
