import { useEffect, useState } from 'react';
import { registerRootComponent } from 'expo';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold } from '@expo-google-fonts/fredoka';
import AzoMessageScreen from '../src/components/onboarding/screens/AzoMessageScreen';
import AzoChatScreen from '../src/components/onboarding/screens/AzoChatScreen';

function Preview() {
  const [stage, setStage] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [loaded] = useFonts({
    'Fredoka-Regular': Fredoka_400Regular,
    'Fredoka-Medium': Fredoka_500Medium,
    'Fredoka-SemiBold': Fredoka_600SemiBold,
  });
  useEffect(() => {
    if (!loaded) return;
    SplashScreen.hideAsync();
    const chat = setTimeout(() => setStage(1), 15000);
    const room = setTimeout(() => setAnswers(['recognize', 'start', 'show']), 30000);
    return () => { clearTimeout(chat); clearTimeout(room); };
  }, [loaded]);
  if (!loaded) return null;
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {stage === 0 ? <AzoMessageScreen onContinue={() => setStage(1)} /> : (
        <AzoChatScreen answers={answers} onAnswersChange={setAnswers} onContinue={() => {}} onBack={() => setStage(0)} />
      )}
    </SafeAreaProvider>
  );
}
registerRootComponent(Preview);
