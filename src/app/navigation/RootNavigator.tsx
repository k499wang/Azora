import { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import AuthLandingScreen from '../../screens/AuthLandingScreen';
import DailyExercisePage from '../../screens/DailyExercisePage';
import ExerciseSessionPage from '../../screens/ExerciseSessionPage';
import { HeartRateScreen } from '../../screens/HeartRateScreen';
import { HeartRateSessionDetailScreen } from '../../screens/HeartRateSessionDetailScreen';
import { ProPaywallScreen } from '../../screens/ProPaywallScreen';
import ShareableResultScreen from '../../screens/ShareableResultScreen';
import { useAppGate } from '../../hooks/useAppGate';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { OnboardingFlow } from '../../components/onboarding';
import { PaywallPlacement } from '../../services/paywall';
import { FeatureKey } from '../../services/subscriptions/featureAccess';
import { colors } from '../../theme/colors';
import { MainTabs } from './MainTabs';
import type {
  DailyExerciseScreenProps,
  ExerciseSessionScreenProps,
  HeartRateScreenProps,
  RootStackParamList,
} from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function GatedLoadingScreen() {
  return (
    <View style={styles.loadingScreen}>
      <ActivityIndicator color={colors.primary.blue600} />
    </View>
  );
}

function GatedHeartRateScreen(props: HeartRateScreenProps) {
  const access = useFeatureAccess(FeatureKey.HeartRateMeasurement);

  useEffect(() => {
    if (access.isLoading || access.allowed) return;

    props.navigation.replace('ProPaywall', {
      placement: PaywallPlacement.HeartRateProGate,
      sourceScreen: 'HeartRate',
      feature: FeatureKey.HeartRateMeasurement,
    });
  }, [access.allowed, access.isLoading, props.navigation]);

  if (access.isLoading) {
    return <GatedLoadingScreen />;
  }

  if (!access.allowed) {
    return <GatedLoadingScreen />;
  }

  return <HeartRateScreen {...props} />;
}

function GatedExerciseSessionPage(props: ExerciseSessionScreenProps) {
  const access = useFeatureAccess(FeatureKey.DailyExercise);

  useEffect(() => {
    if (access.isLoading || access.allowed) return;

    props.navigation.replace('ProPaywall', {
      placement: PaywallPlacement.ExercisePremiumGate,
      sourceScreen: 'ExerciseSession',
      feature: FeatureKey.DailyExercise,
    });
  }, [access.allowed, access.isLoading, props.navigation]);

  if (access.isLoading) {
    return <GatedLoadingScreen />;
  }

  if (!access.allowed) {
    return <GatedLoadingScreen />;
  }

  return <ExerciseSessionPage {...props} />;
}

function GatedDailyExercisePage(props: DailyExerciseScreenProps) {
  const access = useFeatureAccess(FeatureKey.DailyExercise);

  useEffect(() => {
    if (access.isLoading || access.allowed) return;

    props.navigation.replace('ProPaywall', {
      placement: PaywallPlacement.ExercisePremiumGate,
      sourceScreen: 'DailyExercise',
      feature: FeatureKey.DailyExercise,
    });
  }, [access.allowed, access.isLoading, props.navigation]);

  if (access.isLoading) {
    return <GatedLoadingScreen />;
  }

  if (!access.allowed) {
    return <GatedLoadingScreen />;
  }

  return <DailyExercisePage {...props} />;
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="HeartRate"
        component={GatedHeartRateScreen}
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="ProPaywall"
        component={ProPaywallScreen}
        options={{
          presentation: 'modal',
          animation: 'none',
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
        component={GatedExerciseSessionPage}
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="DailyExercise"
        component={GatedDailyExercisePage}
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
        <ActivityIndicator color={colors.primary.blue600} />
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
            onComplete={(result) => gate.completeOnboarding(result)}
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
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
  },
  onboardingOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
