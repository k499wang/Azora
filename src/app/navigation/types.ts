import type {
  CompositeNavigationProp,
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';
import type {
  BottomTabNavigationProp,
  BottomTabScreenProps,
} from '@react-navigation/bottom-tabs';
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
    sourceAction?: string;
    feature?: FeatureKeyValue;
  };
  HeartRateSessionDetail: { sessionId: string };
  ExerciseSession: { techniqueId: string };
  SessionComplete: {
    techniqueId: string;
    techniqueName: string;
    breathCount: number;
    targetBreaths: number;
    durationSec: number;
    targetSec: number;
    cycles: number;
    targetCycles: number;
    avgBpm?: number;
    hrSamples?: Array<{ offsetMs: number; bpm: number }>;
  };
  DailyExercise: undefined;
  Settings: undefined;
  DailyResult: {
    holdSeconds: number;
    avgBpm?: number;
    minBpm?: number;
    maxBpm?: number;
    bpmSamples?: { offsetMs: number; bpm: number }[];
  };
};

export type RootStackScreenProps<Screen extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, Screen>;

export type MainTabScreenProps<Screen extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, Screen>,
    NativeStackScreenProps<RootStackParamList>
  >;

export type RootStackNavigationProp<
  Screen extends keyof RootStackParamList = keyof RootStackParamList,
> = NativeStackNavigationProp<RootStackParamList, Screen>;

export type MainTabNavigationProp<
  Screen extends keyof MainTabParamList = keyof MainTabParamList,
> = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, Screen>,
  NativeStackNavigationProp<RootStackParamList>
>;

export type HomeScreenProps = { navigation: RootStackNavigationProp };
export type ProfileScreenProps = { navigation: RootStackNavigationProp };

export type HeartRateScreenProps = RootStackScreenProps<'HeartRate'>;
export type ProPaywallScreenProps = RootStackScreenProps<'ProPaywall'>;
export type HeartRateSessionDetailScreenProps = RootStackScreenProps<'HeartRateSessionDetail'>;
export type ExerciseSessionScreenProps = RootStackScreenProps<'ExerciseSession'>;
export type SessionCompleteScreenProps = RootStackScreenProps<'SessionComplete'>;
export type DailyExerciseScreenProps = RootStackScreenProps<'DailyExercise'>;
export type SettingsScreenProps = RootStackScreenProps<'Settings'>;
export type DailyResultScreenProps = RootStackScreenProps<'DailyResult'>;
