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
import type { RoutineLibraryId } from '../../data/routineLibrary';

export type MainTabParamList = {
  Home: undefined;
  /** Weekly calendar and personal routine. */
  Plan: undefined;
  /** Curated routine ideas and practical home-care resources. */
  Explore: undefined;
  Insights: undefined;
  Profile: undefined;
};

/** Shared by every room screen. See `RoomDecorate` below. */
export type RoomScreenParams = { fromLab?: boolean } | undefined;

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  /** AI-guided first steps for a photographed messy space. */
  PhotoCleanup: { preview?: boolean } | undefined;
  Heart: undefined;
  HeartRate: { context?: string } | undefined;
  ExerciseSearch: undefined;
  /** Curated starting points for personal routine to-dos. */
  RoutineBrowser: undefined;
  RoutineCategory: { categoryId: string };
  RoutineLibraryDetail: { libraryId: RoutineLibraryId };
  Garden: undefined;
  /** every room so far, opened from Insights */
  Hotel: undefined;
  ProPaywall: {
    placement: PaywallPlacementValue;
    sourceScreen?: string;
    sourceAction?: string;
    feature?: FeatureKeyValue;
    isBlocking?: boolean;
  };
  HeartRateSessionDetail: { sessionId: string };
  ExerciseSession: { techniqueId: string; durationMinutes?: number };
  /** The daily check-in, one question a page. */
  MoodCheckIn: undefined;
  /** The day's lesson. It takes no parameters; see `LessonScreen`. */
  Lesson: undefined;
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
  ExitOffer: undefined;
  /**
   * `fromLab` is set only by the dev room lab. The room screens are reached one
   * way and left one way in the real flow, so they carry no back arrow — but a
   * screen opened from the lab needs a way out, and the lab is where you jump
   * into these out of order.
   */
  RoomDecorate: RoomScreenParams;
  RoomComplete: RoomScreenParams;
  /** choosing the look of the room about to open */
  NextRoom: RoomScreenParams;
  /** dev-only harness for the room's animations */
  RoomLab: undefined;
  /** dev-only harness for the plan's cards in every state they can reach */
  PlanLab: undefined;
  /** dev-only Hotel preview opened from RoomLab */
  HotelPreview: RoomScreenParams;
  Settings: undefined;
  /** day-by-day record; opens on `date` when given, otherwise today */
  History: { date?: string } | undefined;
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
export type InsightsScreenProps = MainTabScreenProps<'Insights'>;

export type HeartScreenProps = RootStackScreenProps<'Heart'>;
export type PhotoCleanupScreenProps = RootStackScreenProps<'PhotoCleanup'>;
export type HeartRateScreenProps = RootStackScreenProps<'HeartRate'>;
export type ExerciseSearchScreenProps = RootStackScreenProps<'ExerciseSearch'>;
export type RoutineBrowserScreenProps = RootStackScreenProps<'RoutineBrowser'>;
export type RoutineCategoryScreenProps = RootStackScreenProps<'RoutineCategory'>;
export type RoutineLibraryDetailScreenProps = RootStackScreenProps<'RoutineLibraryDetail'>;
export type GardenScreenProps = RootStackScreenProps<'Garden'>;
export type HotelScreenProps = RootStackScreenProps<'Hotel'>;
export type ProPaywallScreenProps = RootStackScreenProps<'ProPaywall'>;
export type HeartRateSessionDetailScreenProps = RootStackScreenProps<'HeartRateSessionDetail'>;
export type ExerciseSessionScreenProps = RootStackScreenProps<'ExerciseSession'>;
export type SessionCompleteScreenProps = RootStackScreenProps<'SessionComplete'>;
export type MoodCheckInScreenProps = RootStackScreenProps<'MoodCheckIn'>;
export type LessonScreenProps = RootStackScreenProps<'Lesson'>;
export type RoomDecorateScreenProps = RootStackScreenProps<'RoomDecorate'>;
export type RoomCompleteScreenProps = RootStackScreenProps<'RoomComplete'>;
export type RoomLabScreenProps = RootStackScreenProps<'RoomLab'>;
export type PlanLabScreenProps = RootStackScreenProps<'PlanLab'>;
export type HotelPreviewScreenProps = RootStackScreenProps<'HotelPreview'>;
export type NextRoomScreenProps = RootStackScreenProps<'NextRoom'>;
export type ProfileScreenProps = MainTabScreenProps<'Profile'>;
export type SettingsScreenProps = RootStackScreenProps<'Settings'>;
export type PlanScreenProps = MainTabScreenProps<'Plan'>;
export type HistoryScreenProps = RootStackScreenProps<'History'>;
export type ExitOfferScreenProps = RootStackScreenProps<'ExitOffer'>;
