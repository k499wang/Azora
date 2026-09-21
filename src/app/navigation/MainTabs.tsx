import { useRef } from 'react';
import { createNativeBottomTabNavigator } from '@react-navigation/bottom-tabs/unstable';
import HomeScreen from '../../screens/HomeScreen';
import PlanScreen from '../../screens/PlanScreen';
import RoutineLibraryScreen from '../../screens/RoutineLibraryScreen';
import InsightsScreen from '../../screens/InsightsScreen';
import ProfileScreen from '../../screens/ProfileScreen';
import type { MainTabParamList } from './types';
import { fonts } from '../../theme/typography';
import { triggerTapHaptic } from '../../native/tapHaptics';
import TourOverlay from '../../features/tour/TourOverlay';

const Tab = createNativeBottomTabNavigator<MainTabParamList>();

interface MainTabsProps {
  tourEnabled: boolean;
}

export function MainTabs({ tourEnabled }: MainTabsProps) {
  // The native tab bar emits tabPress even when re-tapping the active tab;
  // only buzz when the user actually switches tabs.
  const lastActiveTabRef = useRef<keyof MainTabParamList>('Home');

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          // Sidebar-adaptable: UIKit draws a sidebar at regular width (iPad,
          // and a wide iPad window) and falls back to the bottom bar at compact
          // width, including every iPhone and a narrow Split View window. This
          // is the one place the app gets a real iPad navigation idiom for
          // free — iOS 18+; older systems just keep the tab bar.
          tabBarControllerMode: 'tabSidebar',
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
          name="Plan"
          component={PlanScreen}
          options={{
            tabBarLabel: 'Routine',
            tabBarIcon: ({ focused }) => ({
              type: 'sfSymbol',
              name: focused ? 'doc.text.fill' : 'doc.text',
            }),
          }}
        />
        <Tab.Screen
          name="Insights"
          component={InsightsScreen}
          options={{
            tabBarLabel: 'Plan',
            tabBarIcon: ({ focused }) => ({
              type: 'sfSymbol',
              name: focused ? 'chart.bar.fill' : 'chart.bar',
            }),
          }}
        />
        <Tab.Screen
          name="Explore"
          component={RoutineLibraryScreen}
          options={{
            tabBarLabel: 'Explore',
            tabBarIcon: ({ focused }) => ({
              type: 'sfSymbol',
              name: focused ? 'square.grid.2x2.fill' : 'square.grid.2x2',
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
              name: focused ? 'person.fill' : 'person',
            }),
          }}
        />
      </Tab.Navigator>
      {tourEnabled ? <TourOverlay /> : null}
    </>
  );
}
