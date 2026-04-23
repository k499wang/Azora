import { useCallback } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
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
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './src/app/navigation';
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
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

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <StatusBar style="dark" />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
