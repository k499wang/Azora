import { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  createBottomTabNavigator,
  type BottomTabBarButtonProps,
} from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import HomeScreen from '../../screens/HomeScreen';
import ProfileScreen from '../../screens/ProfileScreen';
import Icon from '../../components/common/icons/Icon';
import BreatheActionSheet, {
  type BreatheActionId,
} from '../../components/common/BreatheActionSheet';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { PaywallPlacement } from '../../services/paywall';
import { FeatureKey } from '../../services/subscriptions/featureAccess';
import type {
  MainTabParamList,
  RootStackNavigationProp,
} from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

function EmptyScreen() {
  return <View style={styles.hiddenScreen} />;
}

function BreatheTabButton({ onPress, accessibilityState }: BottomTabBarButtonProps) {
  return (
    <View style={styles.measureSlot}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={accessibilityState}
        accessibilityLabel="Breathe"
        style={({ pressed }) => [
          styles.measureButton,
          pressed && styles.measureButtonPressed,
        ]}
      >
        <Icon name="meditation" size={28} color={colors.text.inverse} />
      </Pressable>
    </View>
  );
}

export function MainTabs() {
  const navigation = useNavigation<RootStackNavigationProp<'MainTabs'>>();
  const [sheetVisible, setSheetVisible] = useState(false);
  const heartRateAccess = useFeatureAccess(FeatureKey.HeartRateMeasurement);
  const exerciseAccess = useFeatureAccess(FeatureKey.DailyExercise);

  const handleSelect = (id: BreatheActionId) => {
    setSheetVisible(false);

    if (id === 'daily') {
      if (!exerciseAccess.allowed && !exerciseAccess.isLoading) {
        navigation.navigate('ProPaywall', {
          placement: PaywallPlacement.ExercisePremiumGate,
          sourceScreen: 'MainTabs',
          feature: FeatureKey.DailyExercise,
        });
        return;
      }
      navigation.navigate('DailyExercise');
    } else if (id === 'box') {
      if (!exerciseAccess.allowed && !exerciseAccess.isLoading) {
        navigation.navigate('ProPaywall', {
          placement: PaywallPlacement.ExercisePremiumGate,
          sourceScreen: 'MainTabs',
          feature: FeatureKey.DailyExercise,
        });
        return;
      }
      navigation.navigate('ExerciseSession', { techniqueId: 'box' });
    } else {
      console.log('[hr-gate] MainTabs HR tap', {
        allowed: heartRateAccess.allowed,
        isLoading: heartRateAccess.isLoading,
        isPro: heartRateAccess.isPro,
        used: heartRateAccess.used,
        limit: heartRateAccess.limit,
        reason: heartRateAccess.reason,
      });
      if (!heartRateAccess.allowed && !heartRateAccess.isLoading) {
        console.log('[hr-gate] MainTabs HR: routing to ProPaywall');
        navigation.navigate('ProPaywall', {
          placement: PaywallPlacement.HeartRateProGate,
          sourceScreen: 'MainTabs',
          feature: FeatureKey.HeartRateMeasurement,
        });
        return;
      }
      console.log('[hr-gate] MainTabs HR: navigating to HeartRate');
      navigation.navigate('HeartRate');
    }
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary.blue600,
          tabBarInactiveTintColor: colors.text.tertiary,
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: colors.background.elevated,
            borderTopColor: colors.border.subtle,
            height: 74,
            paddingTop: spacing.sm,
            paddingBottom: spacing.sm,
          },
          tabBarItemStyle: {
            alignItems: 'center',
            justifyContent: 'center',
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Measure"
          component={EmptyScreen}
          options={{
            tabBarButton: (props) => <BreatheTabButton {...props} />,
          }}
          listeners={{
            tabPress: (event) => {
              event.preventDefault();
              setSheetVisible(true);
            },
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="account-outline" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>

      <BreatheActionSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onSelect={handleSelect}
      />
    </>
  );
}

const styles = StyleSheet.create({
  hiddenScreen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  measureSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  measureButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.primary.blue600,
    alignItems: 'center',
    justifyContent: 'center',
    top: -spacing.lg,
    shadowColor: colors.primary.blue700,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  measureButtonPressed: {
    transform: [{ scale: 0.96 }],
  },
});
