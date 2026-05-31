import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Tabs } from 'react-native-screens';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../../screens/HomeScreen';
import ProfileScreen from '../../screens/ProfileScreen';
import BreatheActionSheet, {
  type BreatheActionId,
} from '../../components/common/BreatheActionSheet';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { PaywallPlacement } from '../../services/paywall';
import { FeatureKey } from '../../services/subscriptions/featureAccess';
import { useAuthStore } from '../../stores/authStore';
import { useRecommendedTechnique } from '../../hooks/useRecommendedTechnique';
import type { RootStackNavigationProp } from './types';

// Approximate height of the native iOS tab bar pill (excludes safe-area inset).
const NATIVE_TAB_BAR_HEIGHT = 49;

const HOME_KEY = 'Home';
const PROFILE_KEY = 'Profile';
const BREATHE_KEY = 'Breathe';

type FocusableTabKey = typeof HOME_KEY | typeof PROFILE_KEY;

export function MainTabs() {
  const navigation = useNavigation<RootStackNavigationProp<'MainTabs'>>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const [focusedKey, setFocusedKey] = useState<FocusableTabKey>(
    (route.params as { screen?: FocusableTabKey } | undefined)?.screen ?? HOME_KEY,
  );
  const [sheetVisible, setSheetVisible] = useState(false);
  const heartRateAccess = useFeatureAccess(FeatureKey.HeartRateMeasurement);
  const exerciseAccess = useFeatureAccess(FeatureKey.DailyExercise);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const recommendedTechnique = useRecommendedTechnique(userId);

  const requestedScreen = (route.params as { screen?: FocusableTabKey } | undefined)?.screen;
  useEffect(() => {
    if (requestedScreen) {
      setFocusedKey(requestedScreen);
    }
  }, [requestedScreen]);

  const handleSheetClose = () => setSheetVisible(false);

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
      if (!heartRateAccess.allowed && !heartRateAccess.isLoading) {
        navigation.navigate('ProPaywall', {
          placement: PaywallPlacement.HeartRateProGate,
          sourceScreen: 'MainTabs',
          feature: FeatureKey.HeartRateMeasurement,
        });
        return;
      }
      navigation.navigate('HeartRate');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs.Host
        experimentalControlNavigationStateInJS
        onNativeFocusChange={(e) => {
          const key = e.nativeEvent.tabKey;
          // The breathe capsule is a native button, not a destination: open the
          // sheet in place and never move focus, so the page never changes.
          if (key === BREATHE_KEY) {
            setSheetVisible((v) => !v);
            return;
          }
          setSheetVisible(false);
          setFocusedKey(key as FocusableTabKey);
        }}
      >
        <Tabs.Screen
          tabKey={HOME_KEY}
          isFocused={focusedKey === HOME_KEY}
          title="Home"
          icon={{ ios: { type: 'sfSymbol', name: 'house.fill' } }}
        >
          <HomeScreen navigation={navigation} />
        </Tabs.Screen>
        <Tabs.Screen
          tabKey={PROFILE_KEY}
          isFocused={focusedKey === PROFILE_KEY}
          title="Profile"
          icon={{ ios: { type: 'sfSymbol', name: 'person.fill' } }}
        >
          <ProfileScreen navigation={navigation} />
        </Tabs.Screen>
        <Tabs.Screen
          tabKey={BREATHE_KEY}
          isFocused={false}
          systemItem="search"
          title="Breathe"
          icon={{ ios: { type: 'sfSymbol', name: 'plus' } }}
        >
          <View style={{ flex: 1, backgroundColor: colors.background.primary }} />
        </Tabs.Screen>
      </Tabs.Host>

      <BreatheActionSheet
        bottomOffset={insets.bottom + NATIVE_TAB_BAR_HEIGHT + spacing.sm}
        horizontalAnchor="right"
        visible={sheetVisible}
        onClose={handleSheetClose}
        onSelect={handleSelect}
        recommendedTechnique={recommendedTechnique.technique}
        isRecommendedTechniqueLoading={recommendedTechnique.isLoading}
      />
    </View>
  );
}
