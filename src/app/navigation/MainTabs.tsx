import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  createBottomTabNavigator,
  type BottomTabBarButtonProps,
} from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import HomeScreen from '../../screens/HomeScreen';
import ProfileScreen from '../../screens/ProfileScreen';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type {
  MainTabParamList,
  RootStackNavigationProp,
} from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

function EmptyScreen() {
  return <View style={styles.hiddenScreen} />;
}

function MeasureTabButton({ onPress, accessibilityState }: BottomTabBarButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      accessibilityLabel="Measure heart rate"
      style={({ pressed }) => [
        styles.measureButton,
        pressed && styles.measureButtonPressed,
      ]}
    >
      <MaterialCommunityIcons
        name="heart-pulse"
        size={28}
        color={colors.text.inverse}
      />
    </Pressable>
  );
}

export function MainTabs() {
  const navigation = useNavigation<RootStackNavigationProp<'MainTabs'>>();

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
          height: 74,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
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
          tabBarButton: (props) => <MeasureTabButton {...props} />,
        }}
        listeners={{
          tabPress: (event) => {
            event.preventDefault();
            navigation.navigate('HeartRate');
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
  );
}

const styles = StyleSheet.create({
  hiddenScreen: {
    flex: 1,
    backgroundColor: colors.background.primary,
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
