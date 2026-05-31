import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createNativeBottomTabNavigator } from '@react-navigation/bottom-tabs/unstable';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
import Svg, { Path } from 'react-native-svg';

const canUseLiquidGlass = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../../screens/HomeScreen';
import ProfileScreen from '../../screens/ProfileScreen';
import BreatheActionSheet, {
  type BreatheActionId,
} from '../../components/common/BreatheActionSheet';
import Icon, { type IconName } from '../../components/common/icons/Icon';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography, fonts } from '../../theme/typography';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { PaywallPlacement } from '../../services/paywall';
import { FeatureKey } from '../../services/subscriptions/featureAccess';
import { useAuthStore } from '../../stores/authStore';
import { useRecommendedTechnique } from '../../hooks/useRecommendedTechnique';
import type {
  MainTabParamList,
  RootStackNavigationProp,
} from './types';

const Tab = createNativeBottomTabNavigator<MainTabParamList>();

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

const FLOATING_ACTION_SIZE = 64;
const FAB_RADIUS = FLOATING_ACTION_SIZE / 2;
const FLOATING_DOCK_BOTTOM_OFFSET = 12;

const DOCK_HEIGHT = 60;
const NOTCH_RADIUS = FAB_RADIUS + 4; // 4px clearance so FAB doesn't kiss the notch edge
const DOCK_HORIZONTAL_MARGIN = spacing.lg;


// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

type MainDockTabName = keyof MainTabParamList;

const MAIN_DOCK_TABS: Array<{
  name: MainDockTabName;
  label: string;
  icon: IconName;
}> = [
  { name: 'Home', label: 'Home', icon: 'home' },
  { name: 'Profile', label: 'Profile', icon: 'profile' },
];

export function MainTabs() {
  const navigation = useNavigation<RootStackNavigationProp<'MainTabs'>>();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<MainDockTabName>('Home');
  const fabProgress = useRef(new Animated.Value(0)).current;
  const heartRateAccess = useFeatureAccess(FeatureKey.HeartRateMeasurement);
  const exerciseAccess = useFeatureAccess(FeatureKey.DailyExercise);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const recommendedTechnique = useRecommendedTechnique(userId);

  const dockWidth = screenWidth - DOCK_HORIZONTAL_MARGIN * 2;
  const tabAreaWidth = (dockWidth - NOTCH_RADIUS * 2) / 2;

  const handleSheetClose = () => setSheetVisible(false);

  useEffect(() => {
    Animated.timing(fabProgress, {
      toValue: sheetVisible ? 1 : 0,
      duration: 220,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [sheetVisible, fabProgress]);

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
      if (recommendedTechnique.technique == null) {
        return;
      }

      if (!exerciseAccess.allowed && !exerciseAccess.isLoading) {
        navigation.navigate('ProPaywall', {
          placement: PaywallPlacement.ExercisePremiumGate,
          sourceScreen: 'MainTabs',
          feature: FeatureKey.DailyExercise,
        });
        return;
      }
      navigation.navigate('ExerciseSession', {
        techniqueId: recommendedTechnique.technique.id,
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

  const handleDockTabPress = (tabName: MainDockTabName) => {
    setActiveTab(tabName);
    navigation.navigate('MainTabs', { screen: tabName });
  };

  const floatingActionBottom = insets.bottom + FLOATING_DOCK_BOTTOM_OFFSET;
  // FAB is half-sunk: its center sits at the top edge of the dock.
  const fabCenterBottom = floatingActionBottom + DOCK_HEIGHT;
  const anchorHeight = FAB_RADIUS + DOCK_HEIGHT;

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
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
          listeners={{ focus: () => setActiveTab('Home') }}
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
          listeners={{ focus: () => setActiveTab('Profile') }}
        />
      </Tab.Navigator>

      {/* Notched dock with half-sunk FAB */}
      <View
        pointerEvents="box-none"
        style={[
          styles.dockAnchor,
          { bottom: floatingActionBottom, height: anchorHeight },
        ]}
      >
        {/* Dock body: SVG path with notch + content overlay */}
        <View style={[styles.dockShadow, { width: dockWidth }]}>
          <NotchedBackground width={dockWidth} height={DOCK_HEIGHT} />
          <DockTabs
            activeTab={activeTab}
            onPress={handleDockTabPress}
            tabAreaWidth={tabAreaWidth}
          />
        </View>

        {/* FAB sits half-sunk into the notch */}
        <View style={styles.fabAnchor} pointerEvents="box-none">
          <Pressable
            accessibilityLabel="Open breathing actions"
            accessibilityRole="button"
            onPress={() => setSheetVisible((v) => !v)}
            style={({ pressed }) => [
              styles.fabPressable,
              pressed && styles.fabPressed,
            ]}
          >
            <GlassFab>
              <FloatingActionContent progress={fabProgress} />
            </GlassFab>
          </Pressable>
        </View>
      </View>

      <BreatheActionSheet
        bottomOffset={fabCenterBottom + FAB_RADIUS + 8}
        horizontalAnchor="center"
        visible={sheetVisible}
        onClose={handleSheetClose}
        onSelect={handleSelect}
        recommendedTechnique={recommendedTechnique.technique}
        isRecommendedTechniqueLoading={recommendedTechnique.isLoading}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Notched dock background
// ---------------------------------------------------------------------------

function NotchedBackground({ width, height }: { width: number; height: number }) {
  const pathD = useMemo(() => {
    const cornerRadius = height / 2;
    const centerX = width / 2;
    const notchStart = centerX - NOTCH_RADIUS;
    const notchEnd = centerX + NOTCH_RADIUS;

    // Pill with a concave semicircular notch on the top edge.
    // SVG y-down: sweep-flag=0 on the notch arc bulges DOWN into the shape.
    return [
      `M ${cornerRadius} 0`,
      `L ${notchStart} 0`,
      `A ${NOTCH_RADIUS} ${NOTCH_RADIUS} 0 0 0 ${notchEnd} 0`,
      `L ${width - cornerRadius} 0`,
      `A ${cornerRadius} ${cornerRadius} 0 0 1 ${width} ${cornerRadius}`,
      `L ${width} ${height - cornerRadius}`,
      `A ${cornerRadius} ${cornerRadius} 0 0 1 ${width - cornerRadius} ${height}`,
      `L ${cornerRadius} ${height}`,
      `A ${cornerRadius} ${cornerRadius} 0 0 1 0 ${height - cornerRadius}`,
      `L 0 ${cornerRadius}`,
      `A ${cornerRadius} ${cornerRadius} 0 0 1 ${cornerRadius} 0`,
      'Z',
    ].join(' ');
  }, [width, height]);

  // Mask: opaque-filled notched path; MaskedView uses its alpha to clip the glass.
  const mask = (
    <Svg width={width} height={height}>
      <Path d={pathD} fill="black" />
    </Svg>
  );

  return (
    <View
      style={[StyleSheet.absoluteFill, { width, height }]}
      pointerEvents="none"
    >
      <MaskedView style={{ width, height }} maskElement={mask}>
        {canUseLiquidGlass ? (
          <GlassView
            colorScheme="light"
            glassEffectStyle="clear"
            style={{ width, height }}
            tintColor="rgba(255,255,255,0.46)"
          />
        ) : (
          <BlurView
            intensity={76}
            tint="systemUltraThinMaterialLight"
            style={{
              width,
              height,
              backgroundColor: 'rgba(255,255,255,0.6)',
            }}
          />
        )}
      </MaskedView>
      {/* Hairline edge along the notched outline */}
      <Svg
        width={width}
        height={height}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Path
          d={pathD}
          fill="none"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth={1}
        />
      </Svg>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Dock tabs with sliding indicator
// ---------------------------------------------------------------------------

function DockTabs({
  activeTab,
  onPress,
  tabAreaWidth,
}: {
  activeTab: MainDockTabName;
  onPress: (tabName: MainDockTabName) => void;
  tabAreaWidth: number;
}) {
  const homeTab = MAIN_DOCK_TABS[0];
  const profileTab = MAIN_DOCK_TABS[1];

  return (
    <View style={styles.dockContent}>
      <View style={{ width: tabAreaWidth }}>
        <DockTab tab={homeTab} activeTab={activeTab} onPress={onPress} />
      </View>
      <View style={{ width: NOTCH_RADIUS * 2 }} />
      <View style={{ width: tabAreaWidth }}>
        <DockTab tab={profileTab} activeTab={activeTab} onPress={onPress} />
      </View>
    </View>
  );
}

function DockTab({
  tab,
  activeTab,
  onPress,
}: {
  tab: (typeof MAIN_DOCK_TABS)[number];
  activeTab: MainDockTabName;
  onPress: (tabName: MainDockTabName) => void;
}) {
  const selected = activeTab === tab.name;
  const color = selected ? colors.primary.blue700 : colors.text.tertiary;

  return (
    <Pressable
      accessibilityLabel={tab.label}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={() => onPress(tab.name)}
      style={({ pressed }) => [
        styles.dockTab,
        pressed && styles.dockTabPressed,
      ]}
    >
      <Icon name={tab.icon} size={22} color={color} />
      <Text
        style={[
          styles.dockTabText,
          { color, fontFamily: selected ? fonts.semibold : fonts.regular },
        ]}
      >
        {tab.label}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// FAB content
// ---------------------------------------------------------------------------

function GlassFab({ children }: { children: ReactNode }) {
  if (canUseLiquidGlass) {
    return (
      <GlassView
        colorScheme="light"
        glassEffectStyle="clear"
        style={styles.fab}
        tintColor={`${colors.primary.blue800}80`}
      >
        {children}
      </GlassView>
    );
  }
  return (
    <BlurView
      intensity={60}
      tint="systemUltraThinMaterialLight"
      style={[styles.fab, styles.fabFallback]}
    >
      {children}
    </BlurView>
  );
}

function FloatingActionContent({ progress }: { progress: Animated.Value }) {
  const meditationOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const meditationRotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });
  const closeOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const closeRotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['-45deg', '0deg'],
  });

  return (
    <View style={styles.fabIconWrap}>
      <Animated.View
        style={[
          styles.fabIcon,
          {
            opacity: meditationOpacity,
            transform: [{ rotate: meditationRotate }],
          },
        ]}
      >
        <Icon name="meditation" size={28} color={colors.text.inverse} />
      </Animated.View>
      <Animated.View
        style={[
          styles.fabIcon,
          {
            opacity: closeOpacity,
            transform: [{ rotate: closeRotate }],
          },
        ]}
      >
        <Icon name="close" size={24} color={colors.text.inverse} />
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  dockAnchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  // Dock body
  dockShadow: {
    height: DOCK_HEIGHT,
    shadowColor: colors.primary.blue700,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 10,
  },
  dockContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  dockTab: {
    height: DOCK_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dockTabPressed: {
    opacity: 0.75,
  },
  dockTabText: {
    ...typography.label.small,
  },

  // FAB — solid blue, half-sunk into the dock's notch.
  fabAnchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: FLOATING_ACTION_SIZE,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  fabPressable: {
    width: FLOATING_ACTION_SIZE,
    height: FLOATING_ACTION_SIZE,
    borderRadius: FLOATING_ACTION_SIZE / 2,
    shadowColor: colors.primary.blue700,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 12,
  },
  fabPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.96 }],
  },
  fab: {
    width: FLOATING_ACTION_SIZE,
    height: FLOATING_ACTION_SIZE,
    borderRadius: FLOATING_ACTION_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fabFallback: {
    backgroundColor: `${colors.primary.blue800}80`,
  },
  fabIconWrap: {
    width: FLOATING_ACTION_SIZE,
    height: FLOATING_ACTION_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: {
    position: 'absolute',
  },
});
