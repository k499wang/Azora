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
import type { LessonId } from '../../features/lessons/domain/lessonCatalogue';
import type { ExitOfferVariant } from '../../components/paywall/ExitOfferContent';

export type MainTabParamList = {
  Home: undefined;
  /** Weekly calendar and personal routine. */
  Plan: undefined;
  /** Curated routine ideas and practical home-care resources. */
  Explore: undefined;
  Insights: { previewFinishedPlan?: boolean } | undefined;
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
  MyRoutine: undefined;
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
  ExerciseSession: {
    techniqueId: string;
    durationMinutes?: number;
    /** the check-in that offered it finished the day */
    celebrateDay?: boolean;
    /** what the check-in that offered it earned, shown flying in on the result */
    carriedCoins?: number;
  };
  /** The daily check-in, one question a page. */
  MoodCheckIn: undefined;
  /** The day's lesson, or a read-only development preview from Lesson Lab. */
  Lesson: { previewLessonId: LessonId } | undefined;
  /** The coins a plan lesson, check-in or Reset just earned, before the day moves on. */
  ActivityReward: (
    | { kind: 'lesson' | 'mood' | 'todo' }
    | { kind: 'reset'; resetName: string }
  ) & {
    coins: number;
    /** set when the activity finished the day, to celebrate on Home after */
    dayCompleteUnitId?: string;
  };
  /** A guided attention Reset from today's plan, by plan activity id. */
  AttentionSession: { activityId: string };
  SessionComplete: {
    techniqueId: string;
    techniqueName: string;
    /** identifies this session for per-session feedback */
    techniqueBpmResponse?: BreathingTechniqueBpmResponse;
    breathCount: number;
    targetBreaths: number;
    durationSec: number;
    targetSec: number;
    cycles: number;
    targetCycles: number;
    avgBpm?: number;
    hrSamples?: Array<{ offsetMs: number; bpm: number }>;
    /** what this session and the check-in that offered it earned, already credited to the wallet */
    coins?: number;
    /** the check-in that offered it finished the day */
    celebrateDay?: boolean;
    /** dev-only preview from Settings: no celebration, review prompt or saved feedback */
    preview?: boolean;
  };
  ExitOffer: { variant?: ExitOfferVariant } | undefined;
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
  /** dev-only browser for every authored plan lesson */
  LessonLab: undefined;
  /** dev-only preview of individual onboarding screens */
  OnboardingLab: undefined;
  /** dev-only replay of the celebration shown after the pact is signed */
  PactCelebrationPreview: undefined;
  /** dev-only run of the contract screen: sign, seal, celebrate, reset */
  PactPreview: undefined;
  /** dev-only preview of the multi-step onboarding paywall */
  OnboardingPaywallPreview: undefined;
  /** dev-only Hotel preview opened from RoomLab */
  HotelPreview: RoomScreenParams;
  Settings: undefined;
  AccountManagement: undefined;
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
export type MyRoutineScreenProps = RootStackScreenProps<'MyRoutine'>;
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
export type ActivityRewardScreenProps = RootStackScreenProps<'ActivityReward'>;
export type AttentionSessionScreenProps = RootStackScreenProps<'AttentionSession'>;
export type RoomDecorateScreenProps = RootStackScreenProps<'RoomDecorate'>;
export type RoomCompleteScreenProps = RootStackScreenProps<'RoomComplete'>;
export type RoomLabScreenProps = RootStackScreenProps<'RoomLab'>;
export type PlanLabScreenProps = RootStackScreenProps<'PlanLab'>;
export type LessonLabScreenProps = RootStackScreenProps<'LessonLab'>;
export type OnboardingLabScreenProps = RootStackScreenProps<'OnboardingLab'>;
export type PactCelebrationPreviewScreenProps = RootStackScreenProps<'PactCelebrationPreview'>;
export type PactPreviewScreenProps = RootStackScreenProps<'PactPreview'>;
export type OnboardingPaywallPreviewScreenProps = RootStackScreenProps<'OnboardingPaywallPreview'>;
export type HotelPreviewScreenProps = RootStackScreenProps<'HotelPreview'>;
export type NextRoomScreenProps = RootStackScreenProps<'NextRoom'>;
export type ProfileScreenProps = MainTabScreenProps<'Profile'>;
export type SettingsScreenProps = RootStackScreenProps<'Settings'>;
export type AccountManagementScreenProps = RootStackScreenProps<'AccountManagement'>;
export type PlanScreenProps = MainTabScreenProps<'Plan'>;
export type HistoryScreenProps = RootStackScreenProps<'History'>;
export type ExitOfferScreenProps = RootStackScreenProps<'ExitOffer'>;
