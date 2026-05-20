import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import { DotsLoader } from '../../components/common/DotsLoader';
import AuthLandingScreen from '../../screens/AuthLandingScreen';
import DailyExercisePage from '../../screens/DailyExercisePage';
import ExerciseSessionPage from '../../screens/ExerciseSessionPage';
import SessionCompleteScreen from '../../screens/SessionCompleteScreen';
import { HeartRateScreen } from '../../screens/HeartRateScreen';
import { HeartRateSessionDetailScreen } from '../../screens/HeartRateSessionDetailScreen';
import { ProPaywallScreen } from '../../screens/ProPaywallScreen';
import SettingsScreen from '../../screens/SettingsScreen';
import ShareableResultScreen from '../../screens/ShareableResultScreen';
import { useAppGate } from '../../hooks/useAppGate';
import { OnboardingFlow } from '../../components/onboarding';
import { colors } from '../../theme/colors';
import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
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
        component={DailyExercisePage}
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

export function RootNavigator() {
  const gate = useAppGate();

  if (gate.status === 'booting') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background.primary, justifyContent: 'center', alignItems: 'center' }}>
        <DotsLoader />
      </View>
    );
  }

  if (gate.status === 'signed_out') {
    return <AuthLandingScreen />;
  }

  if (gate.status === 'needs_onboarding') {
    return (
      <View style={styles.overlayRoot}>
        <AppStack />
        <View style={styles.onboardingOverlay}>
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

  return <AppStack />;
}

const styles = StyleSheet.create({
  overlayRoot: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  onboardingOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
