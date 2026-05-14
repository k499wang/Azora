import { useEffect, useMemo, useRef, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createNativeBottomTabNavigator } from '@react-navigation/bottom-tabs/unstable';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../../screens/HomeScreen';
import ProfileScreen from '../../screens/ProfileScreen';
import BreatheActionSheet, {
  type BreatheActionId,
} from '../../components/common/BreatheActionSheet';
import Icon from '../../components/common/icons/Icon';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { PaywallPlacement } from '../../services/paywall';
import { FeatureKey } from '../../services/subscriptions/featureAccess';
import { useAuthStore } from '../../stores/authStore';
import { useUserDefaultTechniqueQuery } from '../../queries/profile/useUserDefaultTechniqueQuery';
import TECHNIQUES from '../../data/techniques';
import type {
  MainTabParamList,
  RootStackNavigationProp,
} from './types';

const FALLBACK_TECHNIQUE =
  TECHNIQUES.find((t) => t.id === 'box') ?? TECHNIQUES[0];

const Tab = createNativeBottomTabNavigator<MainTabParamList>();
const canUseLiquidGlass = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
const FLOATING_ACTION_SIZE = 62;
const FLOATING_DOCK_BOTTOM_OFFSET = 14;
const FLOATING_ACTION_TRAY_GAP = 10;
const LEFT_DOCK_WIDTH = 188;
const LEFT_DOCK_HEIGHT = FLOATING_ACTION_SIZE;
const LEFT_DOCK_PADDING = 6;
const LEFT_DOCK_SEGMENT_WIDTH = (LEFT_DOCK_WIDTH - LEFT_DOCK_PADDING * 2) / 2;

type MainDockTabName = keyof MainTabParamList;

const MAIN_DOCK_TABS: Array<{
  name: MainDockTabName;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}> = [
  { name: 'Home', label: 'Home', icon: 'home-outline' },
  { name: 'Profile', label: 'Profile', icon: 'account-outline' },
];

export function MainTabs() {
  const navigation = useNavigation<RootStackNavigationProp<'MainTabs'>>();
  const insets = useSafeAreaInsets();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<MainDockTabName>('Home');
  const dockIndicatorTranslateX = useRef(new Animated.Value(0)).current;
  const heartRateAccess = useFeatureAccess(FeatureKey.HeartRateMeasurement);
  const exerciseAccess = useFeatureAccess(FeatureKey.DailyExercise);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const { data: defaultTechniqueId } = useUserDefaultTechniqueQuery(userId);

  const recommendedTechnique = useMemo(
    () =>
      TECHNIQUES.find((t) => t.id === defaultTechniqueId) ?? FALLBACK_TECHNIQUE,
    [defaultTechniqueId],
  );

  const handleSheetClose = () => {
    setSheetVisible(false);
  };

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
    } else if (id === 'breathe') {
      if (!exerciseAccess.allowed && !exerciseAccess.isLoading) {
        navigation.navigate('ProPaywall', {
          placement: PaywallPlacement.ExercisePremiumGate,
          sourceScreen: 'MainTabs',
          feature: FeatureKey.DailyExercise,
        });
        return;
      }
      navigation.navigate('ExerciseSession', {
        techniqueId: recommendedTechnique.id,
      });
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

  useEffect(() => {
    Animated.spring(dockIndicatorTranslateX, {
      toValue: activeTab === 'Home' ? 0 : LEFT_DOCK_SEGMENT_WIDTH,
      damping: 18,
      mass: 0.8,
      stiffness: 180,
      useNativeDriver: true,
    }).start();
  }, [activeTab, dockIndicatorTranslateX]);

  const handleDockTabPress = (tabName: MainDockTabName) => {
    setActiveTab(tabName);
    navigation.navigate('MainTabs', { screen: tabName });
  };

  const floatingActionBottom = insets.bottom + FLOATING_DOCK_BOTTOM_OFFSET;
  const trayBottomOffset =
    floatingActionBottom + FLOATING_ACTION_SIZE + FLOATING_ACTION_TRAY_GAP;

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            display: 'none',
          },
        }}
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
          listeners={{
            focus: () => setActiveTab('Home'),
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
          listeners={{
            focus: () => setActiveTab('Profile'),
          }}
        />
      </Tab.Navigator>

      <View
        pointerEvents="box-none"
        style={[styles.floatingDockAnchor, { bottom: floatingActionBottom }]}
      >
        <View style={styles.leftDockShadow}>
          {canUseLiquidGlass ? (
            <GlassView
              colorScheme="light"
              glassEffectStyle="clear"
              style={styles.leftDock}
              tintColor="rgba(255,255,255,0.46)"
            >
              <DockTabs
                activeTab={activeTab}
                indicatorTranslateX={dockIndicatorTranslateX}
                onPress={handleDockTabPress}
              />
            </GlassView>
          ) : (
            <BlurView
              intensity={76}
              tint="systemUltraThinMaterialLight"
              style={[styles.leftDock, styles.leftDockFallback]}
            >
              <DockTabs
                activeTab={activeTab}
                indicatorTranslateX={dockIndicatorTranslateX}
                onPress={handleDockTabPress}
              />
            </BlurView>
          )}
        </View>

        <Pressable
          accessibilityLabel="Open breathing actions"
          accessibilityRole="button"
          onPress={() => setSheetVisible(true)}
          style={({ pressed }) => [
            styles.floatingActionPressable,
            pressed && styles.floatingActionPressed,
          ]}
        >
          {canUseLiquidGlass ? (
            <GlassView
              colorScheme="light"
              glassEffectStyle="clear"
              isInteractive
              style={styles.floatingAction}
              tintColor="rgba(255,255,255,0.52)"
            >
              <FloatingActionContent />
            </GlassView>
          ) : (
            <BlurView
              intensity={76}
              tint="systemUltraThinMaterialLight"
              style={[styles.floatingAction, styles.floatingActionFallback]}
            >
              <FloatingActionContent />
            </BlurView>
          )}
        </Pressable>
      </View>

      <BreatheActionSheet
        bottomOffset={trayBottomOffset}
        horizontalAnchor="right"
        visible={sheetVisible}
        onClose={handleSheetClose}
        onSelect={handleSelect}
        recommendedTechnique={recommendedTechnique}
      />
    </>
  );
}

function DockTabs({
  activeTab,
  indicatorTranslateX,
  onPress,
}: {
  activeTab: MainDockTabName;
  indicatorTranslateX: Animated.Value;
  onPress: (tabName: MainDockTabName) => void;
}) {
  return (
    <View style={styles.leftDockContent}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.leftDockIndicator,
          { transform: [{ translateX: indicatorTranslateX }] },
        ]}
      />
      {MAIN_DOCK_TABS.map((tab) => {
        const selected = activeTab === tab.name;
        const color = selected ? colors.primary.blue700 : colors.text.secondary;

        return (
          <Pressable
            key={tab.name}
            accessibilityLabel={tab.label}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onPress(tab.name)}
            style={({ pressed }) => [
              styles.leftDockTab,
              pressed && styles.leftDockTabPressed,
            ]}
          >
            <MaterialCommunityIcons name={tab.icon} size={24} color={color} />
            <Text style={[styles.leftDockTabText, { color }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function FloatingActionContent() {
  return (
    <Icon name="meditation" size={30} color={colors.primary.blue600} />
  );
}

const styles = StyleSheet.create({
  floatingDockAnchor: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftDockShadow: {
    width: LEFT_DOCK_WIDTH,
    height: LEFT_DOCK_HEIGHT,
    borderRadius: LEFT_DOCK_HEIGHT / 2,
    shadowColor: colors.primary.blue700,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 8,
  },
  leftDock: {
    width: LEFT_DOCK_WIDTH,
    height: LEFT_DOCK_HEIGHT,
    borderRadius: LEFT_DOCK_HEIGHT / 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.56)',
  },
  leftDockFallback: {
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  leftDockContent: {
    flex: 1,
    flexDirection: 'row',
    padding: LEFT_DOCK_PADDING,
  },
  leftDockIndicator: {
    position: 'absolute',
    left: LEFT_DOCK_PADDING,
    top: LEFT_DOCK_PADDING,
    width: LEFT_DOCK_SEGMENT_WIDTH,
    height: LEFT_DOCK_HEIGHT - LEFT_DOCK_PADDING * 2,
    borderRadius: (LEFT_DOCK_HEIGHT - LEFT_DOCK_PADDING * 2) / 2,
    backgroundColor: 'rgba(255,255,255,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.68)',
  },
  leftDockTab: {
    width: LEFT_DOCK_SEGMENT_WIDTH,
    height: LEFT_DOCK_HEIGHT - LEFT_DOCK_PADDING * 2,
    borderRadius: (LEFT_DOCK_HEIGHT - LEFT_DOCK_PADDING * 2) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  leftDockTabPressed: {
    opacity: 0.75,
  },
  leftDockTabText: {
    ...typography.label.small,
  },
  floatingActionPressable: {
    width: FLOATING_ACTION_SIZE,
    height: FLOATING_ACTION_SIZE,
    borderRadius: FLOATING_ACTION_SIZE / 2,
    shadowColor: colors.primary.blue700,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 10,
  },
  floatingActionPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
  floatingAction: {
    width: FLOATING_ACTION_SIZE,
    height: FLOATING_ACTION_SIZE,
    borderRadius: FLOATING_ACTION_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.58)',
  },
  floatingActionFallback: {
    backgroundColor: 'rgba(255,255,255,0.74)',
  },
});
