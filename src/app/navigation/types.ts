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

export type MainTabParamList = {
  Home: undefined;
  Measure: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  HeartRate: { context?: string } | undefined;
  HeartRateSessionDetail: { sessionId: string };
  ExerciseSession: { techniqueId: string };
  DailyExercise: undefined;
  DailyResult: {
    holdSeconds: number;
    bpmSamples?: { t: number; bpm: number }[];
    avgBpm?: number;
    minBpm?: number;
    maxBpm?: number;
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

export type HomeScreenProps = MainTabScreenProps<'Home'>;
export type ProfileScreenProps = MainTabScreenProps<'Profile'>;

export type HeartRateScreenProps = RootStackScreenProps<'HeartRate'>;
export type HeartRateSessionDetailScreenProps = RootStackScreenProps<'HeartRateSessionDetail'>;
export type ExerciseSessionScreenProps = RootStackScreenProps<'ExerciseSession'>;
export type DailyExerciseScreenProps = RootStackScreenProps<'DailyExercise'>;
export type DailyResultScreenProps = RootStackScreenProps<'DailyResult'>;
