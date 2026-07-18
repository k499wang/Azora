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
import type { BreathingTechniqueBpmResponse } from '../../lib/heartRate/bpmInsight';
import type { BreathHoldHeartRateResultStatus } from '../../lib/breathHoldCompletion';

export type MainTabParamList = {
  Home: undefined;
  Breath: undefined;
  Heart: undefined;
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
    isBlocking?: boolean;
  };
  HeartRateSessionDetail: { sessionId: string };
  ExerciseSession: { techniqueId: string };
  SessionComplete: {
    techniqueId: string;
    techniqueName: string;
    techniqueBpmResponse?: BreathingTechniqueBpmResponse;
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
  ExitOffer: undefined;
  Settings: undefined;
  DailyResult: {
    holdSeconds: number;
    heartRateResultStatus?: BreathHoldHeartRateResultStatus;
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
export type BreathTabScreenProps = MainTabScreenProps<'Breath'>;
export type HeartTabScreenProps = MainTabScreenProps<'Heart'>;
export type ProfileScreenProps = MainTabScreenProps<'Profile'>;

export type HeartRateScreenProps = RootStackScreenProps<'HeartRate'>;
export type ProPaywallScreenProps = RootStackScreenProps<'ProPaywall'>;
export type HeartRateSessionDetailScreenProps = RootStackScreenProps<'HeartRateSessionDetail'>;
export type ExerciseSessionScreenProps = RootStackScreenProps<'ExerciseSession'>;
export type SessionCompleteScreenProps = RootStackScreenProps<'SessionComplete'>;
export type DailyExerciseScreenProps = RootStackScreenProps<'DailyExercise'>;
export type SettingsScreenProps = RootStackScreenProps<'Settings'>;
export type DailyResultScreenProps = RootStackScreenProps<'DailyResult'>;
export type ExitOfferScreenProps = RootStackScreenProps<'ExitOffer'>;
