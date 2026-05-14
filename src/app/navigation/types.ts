import type {
  CompositeNavigationProp,
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';
import type {
  NativeBottomTabNavigationProp,
  NativeBottomTabScreenProps,
} from '@react-navigation/bottom-tabs/unstable';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import type { PaywallPlacementValue } from '../../services/paywall';
import type { FeatureKeyValue } from '../../services/subscriptions/featureAccess';

export type MainTabParamList = {
  Home: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  HeartRate: { context?: string } | undefined;
  ProPaywall: {
    placement: PaywallPlacementValue;
    sourceScreen?: string;
    feature?: FeatureKeyValue;
  };
  HeartRateSessionDetail: { sessionId: string };
  ExerciseSession: { techniqueId: string };
  DailyExercise: undefined;
  DailyResult: {
    holdSeconds: number;
    avgBpm?: number;
    minBpm?: number;
    maxBpm?: number;
    rmssd?: number | null;
    sdnn?: number | null;
    hrDrop?: number | null;
    stress?: number | null;
    confidence?: number;
    sampleCount?: number;
    hrvAvailabilityReason?: import('../../lib/heartRate/types').HrvAvailabilityReason;
    ibiSamples?: import('../../lib/heartRate/types').IbiSample[];
  };
};

export type RootStackScreenProps<Screen extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, Screen>;

export type MainTabScreenProps<Screen extends keyof MainTabParamList> =
  CompositeScreenProps<
    NativeBottomTabScreenProps<MainTabParamList, Screen>,
    NativeStackScreenProps<RootStackParamList>
  >;

export type RootStackNavigationProp<
  Screen extends keyof RootStackParamList = keyof RootStackParamList,
> = NativeStackNavigationProp<RootStackParamList, Screen>;

export type MainTabNavigationProp<
  Screen extends keyof MainTabParamList = keyof MainTabParamList,
> = CompositeNavigationProp<
  NativeBottomTabNavigationProp<MainTabParamList, Screen>,
  NativeStackNavigationProp<RootStackParamList>
>;

export type HomeScreenProps = MainTabScreenProps<'Home'>;
export type ProfileScreenProps = MainTabScreenProps<'Profile'>;

export type HeartRateScreenProps = RootStackScreenProps<'HeartRate'>;
export type ProPaywallScreenProps = RootStackScreenProps<'ProPaywall'>;
export type HeartRateSessionDetailScreenProps = RootStackScreenProps<'HeartRateSessionDetail'>;
export type ExerciseSessionScreenProps = RootStackScreenProps<'ExerciseSession'>;
export type DailyExerciseScreenProps = RootStackScreenProps<'DailyExercise'>;
export type DailyResultScreenProps = RootStackScreenProps<'DailyResult'>;
