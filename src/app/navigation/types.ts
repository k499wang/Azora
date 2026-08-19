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
import type { BreathHoldHeartRateResultStatus } from '../../features/exercise/dailyBreathHold/domain/breathHoldCompletion';

export type MainTabParamList = {
  Home: undefined;
  Explore: undefined;
  Heart: undefined;
  Profile: undefined;
};

/** Shared by every room screen. See `RoomDecorate` below. */
export type RoomScreenParams = { fromLab?: boolean } | undefined;

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  HeartRate: { context?: string } | undefined;
  ExerciseSearch: undefined;
  Garden: undefined;
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
    /** identifies this session for per-session feedback */
    sessionKey: string;
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
  /**
   * `fromLab` is set only by the dev room lab. The room screens are reached one
   * way and left one way in the real flow, so they carry no back arrow — but a
   * screen opened from the lab needs a way out, and the lab is where you jump
   * into these out of order.
   */
  RoomDecorate: RoomScreenParams;
  RoomComplete: RoomScreenParams;
  /** every finished floor, swiped through */
  Hotel: RoomScreenParams;
  /** choosing the look of the room about to open */
  NextRoom: RoomScreenParams;
  /** dev-only harness for the room's animations */
  RoomLab: undefined;
  Settings: undefined;
  /** day-by-day record; opens on `date` when given, otherwise today */
  History: { date?: string } | undefined;
  DailyResult: {
    holdSeconds: number;
    /** identifies this session for per-session feedback */
    sessionKey: string;
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
export type ExploreScreenProps = MainTabScreenProps<'Explore'>;
export type HeartTabScreenProps = MainTabScreenProps<'Heart'>;
export type ProfileScreenProps = MainTabScreenProps<'Profile'>;

export type HeartRateScreenProps = RootStackScreenProps<'HeartRate'>;
export type ExerciseSearchScreenProps = RootStackScreenProps<'ExerciseSearch'>;
export type GardenScreenProps = RootStackScreenProps<'Garden'>;
export type ProPaywallScreenProps = RootStackScreenProps<'ProPaywall'>;
export type HeartRateSessionDetailScreenProps = RootStackScreenProps<'HeartRateSessionDetail'>;
export type ExerciseSessionScreenProps = RootStackScreenProps<'ExerciseSession'>;
export type SessionCompleteScreenProps = RootStackScreenProps<'SessionComplete'>;
export type DailyExerciseScreenProps = RootStackScreenProps<'DailyExercise'>;
export type RoomDecorateScreenProps = RootStackScreenProps<'RoomDecorate'>;
export type RoomCompleteScreenProps = RootStackScreenProps<'RoomComplete'>;
export type RoomLabScreenProps = RootStackScreenProps<'RoomLab'>;
export type HotelScreenProps = RootStackScreenProps<'Hotel'>;
export type NextRoomScreenProps = RootStackScreenProps<'NextRoom'>;
export type SettingsScreenProps = RootStackScreenProps<'Settings'>;
export type HistoryScreenProps = RootStackScreenProps<'History'>;
export type DailyResultScreenProps = RootStackScreenProps<'DailyResult'>;
export type ExitOfferScreenProps = RootStackScreenProps<'ExitOffer'>;
