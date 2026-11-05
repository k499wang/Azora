import { useEffect, useRef, useState } from 'react';
import { createNativeBottomTabNavigator } from '@react-navigation/bottom-tabs/unstable';
import HomeScreen from '../../screens/HomeScreen';
import PlanScreen from '../../screens/PlanScreen';
import RoutineLibraryScreen from '../../screens/RoutineLibraryScreen';
import InsightsScreen from '../../screens/InsightsScreen';
import ProfileScreen from '../../screens/ProfileScreen';
import type { MainTabParamList } from './types';
import { fonts } from '../../theme/typography';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { loadTourSeen } from '../../services/preferences/tourSeenPreference';
import TourOverlay from '../../features/tour/TourOverlay';
import { useCountCoachingOfferVisit } from '../../features/coaching/useCoachingOffer';
import HiddenTabFreeze from './HiddenTabFreeze';

const Tab = createNativeBottomTabNavigator<MainTabParamList>();

interface MainTabsProps {
  tourEnabled: boolean;
}

export function MainTabs({ tourEnabled }: MainTabsProps) {
  useCountCoachingOfferVisit();
  // The native tab bar emits tabPress even when re-tapping the active tab;
  // only buzz when the user actually switches tabs.
  const lastActiveTabRef = useRef<keyof MainTabParamList>('Plan');
  // The app opens on Routine, except that the tour runs on Home. Mounting the
  // tabs before the flag is known would show Routine for a moment first.
  const [initialTab, setInitialTab] = useState<keyof MainTabParamList | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadTourSeen().then((seen) => {
      if (cancelled) return;
      const tab = seen ? 'Plan' : 'Home';
      lastActiveTabRef.current = tab;
      setInitialTab(tab);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (initialTab == null) return null;

  return (
    <>
      <Tab.Navigator
        initialRouteName={initialTab}
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
        screenLayout={({ children }) => (
          <HiddenTabFreeze>{children}</HiddenTabFreeze>
        )}
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
            tabBarIcon: {
              type: 'image',
              source: require('../../../assets/icons/navigation/home.png'),
              tinted: false,
            },
          }}
        />
        <Tab.Screen
          name="Plan"
          component={PlanScreen}
          options={{
            tabBarLabel: 'Routine',
            tabBarIcon: {
              type: 'image',
              source: require('../../../assets/icons/navigation/routine.png'),
              tinted: false,
            },
          }}
        />
        <Tab.Screen
          name="Insights"
          component={InsightsScreen}
          options={{
            tabBarLabel: 'Plan',
            tabBarIcon: {
              type: 'image',
              source: require('../../../assets/icons/navigation/plan.png'),
              tinted: false,
            },
          }}
        />
        <Tab.Screen
          name="Explore"
          component={RoutineLibraryScreen}
          options={{
            tabBarLabel: 'Explore',
            tabBarIcon: {
              type: 'image',
              source: require('../../../assets/icons/navigation/explore.png'),
              tinted: false,
            },
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarLabel: 'Profile',
            tabBarIcon: {
              type: 'image',
              source: require('../../../assets/icons/navigation/profile.png'),
              tinted: false,
            },
          }}
        />
      </Tab.Navigator>
      {tourEnabled ? <TourOverlay /> : null}
    </>
  );
}
