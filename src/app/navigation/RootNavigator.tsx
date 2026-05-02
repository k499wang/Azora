import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import AuthLandingScreen from '../../screens/AuthLandingScreen';
import DailyExercisePage from '../../screens/DailyExercisePage';
import ExerciseSessionPage from '../../screens/ExerciseSessionPage';
import { HeartRateScreen } from '../../screens/HeartRateScreen';
import { HeartRateSessionDetailScreen } from '../../screens/HeartRateSessionDetailScreen';
import ShareableResultScreen from '../../screens/ShareableResultScreen';
import { useAppGate } from '../../hooks/useAppGate';
import { OnboardingFlow } from '../../components/onboarding';
import { colors } from '../../theme/colors';
import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const gate = useAppGate();

  if (gate.status === 'booting') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background.primary, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.primary.blue600} />
      </View>
    );
  }

  if (gate.status === 'signed_out') {
    return <AuthLandingScreen />;
  }

  if (gate.status === 'needs_onboarding') {
    return (
      <OnboardingFlow
        onComplete={(onboardingGoal) => gate.completeOnboarding({ onboardingGoal })}
      />
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="HeartRate"
        component={HeartRateScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
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
        component={ExerciseSessionPage}
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="DailyExercise"
        component={DailyExercisePage}
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
