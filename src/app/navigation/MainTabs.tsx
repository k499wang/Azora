import { useRef } from 'react';
import { createNativeBottomTabNavigator } from '@react-navigation/bottom-tabs/unstable';
import HomeScreen from '../../screens/HomeScreen';
import ExploreScreen from '../../screens/ExploreScreen';
import HeartTabScreen from '../../screens/HeartTabScreen';
import ProfileScreen from '../../screens/ProfileScreen';
import type { MainTabParamList } from './types';
import { fonts } from '../../theme/typography';
import { triggerTapHaptic } from '../../native/tapHaptics';

const Tab = createNativeBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  // The native tab bar emits tabPress even when re-tapping the active tab;
  // only buzz when the user actually switches tabs.
  const lastActiveTabRef = useRef<keyof MainTabParamList>('Home');

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarControllerMode: 'tabBar',
        tabBarMinimizeBehavior: 'auto',
        tabBarLabelStyle: { fontFamily: fonts.semibold },
      }}
      screenListeners={({ route }) => ({
        tabPress: () => {
          if (lastActiveTabRef.current !== route.name) {
            triggerTapHaptic();
            lastActiveTabRef.current = route.name;
          }
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => ({
            type: 'sfSymbol',
            name: focused ? 'house.fill' : 'house',
          }),
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: ({ focused }) => ({
            type: 'sfSymbol',
            name: focused ? 'safari.fill' : 'safari',
          }),
        }}
      />
      <Tab.Screen
        name="Heart"
        component={HeartTabScreen}
        options={{
          tabBarLabel: 'Heart',
          tabBarIcon: ({ focused }) => ({
            type: 'sfSymbol',
            name: focused ? 'heart.fill' : 'heart',
          }),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => ({
            type: 'sfSymbol',
            name: focused ? 'person.crop.circle.fill' : 'person.crop.circle',
          }),
        }}
      />
    </Tab.Navigator>
  );
}
