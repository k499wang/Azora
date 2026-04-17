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
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from './src/theme/colors';
import { typography } from './src/theme/typography';
import HomeScreen from './src/screens/HomeScreen';
import ExerciseLibraryPage from './src/screens/ExerciseLibraryPage';
import ExerciseSessionPage from './src/screens/ExerciseSessionPage';
import DailyExercisePage from './src/screens/DailyExercisePage';
import ProfileScreen from './src/screens/ProfileScreen';
import ShareableResultScreen from './src/screens/ShareableResultScreen';
import { HeartRateScreen } from './src/screens/HeartRateScreen';
SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary.blue600,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.background.elevated,
          borderTopColor: colors.border.subtle,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home-outline" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Exercise"
        component={ExerciseLibraryPage}
        options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="weather-windy" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="HeartRate"
        component={HeartRateScreen}
        options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="heart-pulse" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-outline" size={size} color={color} /> }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'Nunito-Regular': Nunito_400Regular,
    'Nunito-Medium': Nunito_500Medium,
    'Nunito-SemiBold': Nunito_600SemiBold,
    'Nunito-Bold': Nunito_700Bold,
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
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={MainTabs} />
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
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
