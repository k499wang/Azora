/**
 * Every state the plan's analytics card can reach, on one page.
 *
 * The card's states are the kind you cannot get to on purpose: most of them
 * need an account of a particular age with a particular week behind it, so
 * without this the blurred lock and the honest decline are only ever seen by
 * accident, in production, by a user.
 *
 * Fabricated data, never a fabricated component — the card here is the card
 * the plan screen renders, handed a `WeeklyReview` by hand. If the real one
 * changes, this page changes with it or it stops compiling.
 *
 * Dev only, three times over: the route is registered inside `__DEV__`, the
 * Settings row that opens it is inside `__DEV__`, and this screen refuses to
 * render without it. See `devScreens.test.mjs`.
 */
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  runOnUI,
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
  type AnimatedRef,
  type SharedValue,
} from 'react-native-reanimated';
import AppTopBar from '../components/common/AppTopBar';
import ChunkyButton, { CHUNKY_TONE_QUIET } from '../components/common/ChunkyButton';
import ScreenContent from '../components/common/ScreenContent';
import SectionHeader from '../components/common/SectionHeader';
import { Text } from '../components/common/Text';
import PlanAnalyticsSection from '../features/plan/PlanAnalyticsSection';
import PlanStartEmptyState from '../features/plan/PlanStartEmptyState';
import PlanChoicePicker from '../features/plan/PlanChoicePicker';
import PlanFinishedState from '../features/plan/PlanFinishedState';
import PlanPath from '../features/plan/PlanPath';
import { usePlanPathSeen } from '../features/plan/usePlanPathSeen';
import { startUiTimer } from '../lib/ui/uiThreadTimer';
import type { PathSeen } from '../features/plan/domain/pathCelebration';
import { planCalendar } from '../features/plan/domain/planCalendar';
import { savePlanPathSeen } from '../services/preferences/planPathSeenPreference';
import type { PlanStartOffer } from '../features/plan/domain/planStart';
import {
  PROGRAM_NAME,
  latestProgramPreset,
  type ProgramPlanId,
} from '../features/program/domain/programCatalogue';
import { buildProgramEnrollment } from '../features/program/domain/programEnrollment';
import type { WeeklyReview } from '../features/plan/domain/weeklyReview';
import type {
  FactorEffects,
  MoodTrendPoint,
  ResetEffect,
} from '../features/plan/domain/moodAnalytics';
import type { PlanLabScreenProps } from '../app/navigation';
import { colors } from '../theme/colors';
import { margin, padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';

const WEEK = { start: '2026-09-06', end: '2026-09-12' };

function review(partial: Partial<WeeklyReview>): WeeklyReview {
  return {
    ...WEEK,
    daysKept: 0,
    daysKeptBefore: null,
    mood: null,
    moodBefore: null,
    ...partial,
  };
}

interface AnalyticsCase {
  label: string;
  daysAnswered: number;
  review: WeeklyReview;
  trend: MoodTrendPoint[];
  reset: ResetEffect | null;
  factors: FactorEffects | null;
}

/** A month with a shape and a gap in it, so the broken line is visible. */
const TREND: MoodTrendPoint[] = Array.from({ length: 30 }, (_, index) => {
  const date = new Date(2026, 7, 18 + index);
  const localDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const missing = index > 9 && index < 14;

  return {
    localDate,
    value: missing ? null : 3 + Math.sin(index / 3.5) * 1.2,
  };
});

const NO_TREND: MoodTrendPoint[] = TREND.map((point) => ({
  ...point,
  value: null,
}));

const factor = (tagId: string, label: string, effect: number, days = 6) => ({
  tagId,
  label,
  tagMean: 3.4 + effect,
  effect,
  days,
});

const RESET_GOOD: ResetEffect = {
  keptShare: 0.82,
  missedShare: 0.54,
  keptDays: 22,
  missedDays: 13,
};

const RESET_BAD: ResetEffect = {
  keptShare: 0.41,
  missedShare: 0.68,
  keptDays: 17,
  missedDays: 19,
};

const FACTORS: FactorEffects = {
  baseline: 3.4,
  better: [
    factor('exercise', 'Exercise', 0.8),
    factor('outdoors', 'Outdoors', 0.5),
    factor('friends', 'Friends', 0.3),
  ],
  harder: [
    factor('work', 'Work', -0.9, 14),
    factor('late-night', 'Late night', -0.6),
  ],
};

/**
 * The start card's states, which are otherwise only reachable by an account
 * that has never had a plan. Clearing a real plan to reach the live one is in
 * the room lab; this is for looking at the copy in every shape at once.
 */
interface StartCase {
  label: string;
  offer: PlanStartOffer;
  isStarting: boolean;
  hasFailed: boolean;
}

const OFFER: PlanStartOffer = {
  planId: 'night',
  planName: PROGRAM_NAME,
  weeks: 6,
  isFallback: false,
};

const START_CASES: StartCase[] = [
  {
    label: 'Ready · their own goal resolved',
    offer: OFFER,
    isStarting: false,
    hasFailed: false,
  },
  {
    label: 'Ready · goal unreadable, so the broadest plan',
    offer: { ...OFFER, planId: 'pressure', weeks: 8, isFallback: true },
    isStarting: false,
    hasFailed: false,
  },
  {
    label: 'Starting · the generating bar runs in its place',
    offer: OFFER,
    isStarting: true,
    hasFailed: false,
  },
  {
    label: 'Failed · the card stays so they can try again',
    offer: OFFER,
    isStarting: false,
    hasFailed: true,
  },
];

const CASES: AnalyticsCase[] = [
  {
    label: 'Locked · four check-ins in',
    daysAnswered: 4,
    review: review({ daysKept: 2 }),
    trend: NO_TREND,
    reset: null,
    factors: null,
  },
  {
    label: 'Locked · past the countdown, still nothing to say',
    daysAnswered: 18,
    review: review({ daysKept: 7, daysKeptBefore: 7, mood: 4.2, moodBefore: 4.1 }),
    trend: TREND,
    reset: null,
    factors: null,
  },
  {
    label: 'Open · both findings, week up',
    daysAnswered: 24,
    review: review({ daysKept: 5, daysKeptBefore: 3, mood: 3.6, moodBefore: 3.2 }),
    trend: TREND,
    reset: RESET_GOOD,
    factors: FACTORS,
  },
  {
    label: 'Open · the Resets landed on the harder days',
    daysAnswered: 24,
    review: review({ daysKept: 4, daysKeptBefore: 5, mood: 2.9, moodBefore: 3.4 }),
    trend: TREND,
    reset: RESET_BAD,
    factors: FACTORS,
  },
  {
    label: 'Open · reset effect only, no tag has earned an opinion',
    daysAnswered: 24,
    review: review({ daysKept: 6, daysKeptBefore: 4, mood: 3.8, moodBefore: 3.7 }),
    trend: TREND,
    reset: RESET_GOOD,
    factors: null,
  },
  {
    label: 'Open · factors only, one side of the Reset split too thin',
    daysAnswered: 24,
    review: review({ daysKept: 7, daysKeptBefore: 7, mood: 4.1, moodBefore: 4.1 }),
    trend: TREND,
    reset: null,
    factors: FACTORS,
  },
  {
    label: 'Open · nothing pulls a day down',
    daysAnswered: 24,
    review: review({ daysKept: 5, daysKeptBefore: 5, mood: 3.9, moodBefore: 3.6 }),
    trend: TREND,
    reset: RESET_GOOD,
    factors: { ...FACTORS, harder: [] },
  },
  {
    label: 'Open · no week before it, so no comparison',
    daysAnswered: 24,
    review: review({ daysKept: 5, mood: 3.6 }),
    trend: TREND,
    reset: RESET_GOOD,
    factors: FACTORS,
  },
];

const PATH_PLAN: ProgramPlanId = 'night';
const PATH_ENROLLMENT_ID = 'plan-lab';
const PATH_WEEKS = 2;

const pathEnrollment = (() => {
  const preset = latestProgramPreset(PATH_PLAN);
  if (preset == null) return null;
  const built = buildProgramEnrollment({
    enrollmentId: PATH_ENROLLMENT_ID,
    planId: PATH_PLAN,
    presetRevision: preset.revision,
    enrolledOn: '2026-09-01',
  });
  return built.status === 'enrolled' ? built.enrollment : null;
})();

const days = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, index) => from + index);

interface PathCase {
  label: string;
  caption: string;
  daysDone: number;
  finishedToday: boolean;
  isPro: boolean;
  gold: readonly number[];
  seen: PathSeen;
  /** Offers buying Pro, to wake a day the locked week held back. */
  canBuyPro?: boolean;
}

const PATH_CASES: PathCase[] = [
  {
    label: 'Stamp day 5 (plain)',
    caption: 'Day 5 rises and lands as a plain coin with the stamp sound. Nothing wakes.',
    daysDone: 5,
    finishedToday: true,
    isPro: true,
    gold: [],
    seen: { stampedDay: 4, wokenDay: 5 },
  },
  {
    label: 'Stamp day 5 (gold)',
    caption: 'Day 5 lands gold with the gold sound; days 1 to 4 are already gold.',
    daysDone: 5,
    finishedToday: true,
    isPro: true,
    gold: days(1, 5),
    seen: { stampedDay: 4, wokenDay: 5 },
  },
  {
    label: 'Wake day 6',
    caption: 'The trail into day 6 lights up, then day 6 pops awake with the unlock sound.',
    daysDone: 5,
    finishedToday: false,
    isPro: true,
    gold: [],
    seen: { stampedDay: 5, wokenDay: 5 },
  },
  {
    label: 'Stamp + wake',
    caption: 'Day 5 stamps, then the trail lights and day 6 wakes, in one run.',
    daysDone: 5,
    finishedToday: false,
    isPro: true,
    gold: [],
    seen: { stampedDay: 4, wokenDay: 5 },
  },
  {
    label: 'Wake day 8 (no trail)',
    caption: 'Day 8 starts week 2, so it pops awake with no trail leading in.',
    daysDone: 7,
    finishedToday: false,
    isPro: true,
    gold: [],
    seen: { stampedDay: 7, wokenDay: 7 },
  },
  {
    label: 'Locked week',
    caption: 'Day 7 stamps and locked day 8 stays asleep. Buy Pro and day 8 wakes.',
    daysDone: 7,
    finishedToday: false,
    isPro: false,
    gold: [],
    seen: { stampedDay: 6, wokenDay: 6 },
    canBuyPro: true,
  },
  {
    label: 'Gold week with a gap',
    caption: 'Nothing plays. Day 5 broke the run and looks like any other done coin.',
    daysDone: 10,
    finishedToday: false,
    isPro: true,
    gold: [...days(1, 4), ...days(6, 10)],
    seen: { stampedDay: 10, wokenDay: 11 },
  },
];

const RESTING_CASE = PATH_CASES.length - 1;
/** How late a cold load's finish dates arrive, as a slow network would deliver them. */
const COLD_GOLD_MS = 1500;

interface PathRun {
  index: number;
  run: number;
  boughtPro: boolean;
  /** The gold arrives late, as on a launch with nothing cached. */
  coldLoad: boolean;
}

/** Writes the record the case starts from; the path is remounted to read it. */
function seedPathCase(index: number) {
  savePlanPathSeen(PATH_ENROLLMENT_ID, PATH_CASES[index].seen);
}

interface PathLabProps {
  scrollRef: AnimatedRef<Animated.ScrollView>;
  scrollY: SharedValue<number>;
  revealTop: number;
}

function PathLabSection({ scrollRef, scrollY, revealTop }: PathLabProps) {
  const [current, setCurrent] = useState<PathRun>(() => {
    seedPathCase(RESTING_CASE);
    return { index: RESTING_CASE, run: 0, boughtPro: false, coldLoad: false };
  });
  const [goldRun, setGoldRun] = useState<number | null>(null);
  const seen = usePlanPathSeen(PATH_ENROLLMENT_ID);

  const item = PATH_CASES[current.index];
  const isPro = item.isPro || current.boughtPro;
  const calendar = planCalendar(PATH_PLAN, item.daysDone, item.finishedToday);
  const goldKnown = !current.coldLoad || goldRun === current.run;

  useEffect(() => {
    if (!current.coldLoad) return undefined;
    const { run } = current;
    return startUiTimer(COLD_GOLD_MS, () => setGoldRun(run));
  }, [current]);

  const play = useCallback((index: number, coldLoad = false) => {
    seedPathCase(index);
    setCurrent((previous) => ({ index, run: previous.run + 1, boughtPro: false, coldLoad }));
  }, []);

  const reopen = useCallback(() => {
    setCurrent((previous) => ({ ...previous, run: previous.run + 1, coldLoad: false }));
  }, []);

  const scrollBy = useCallback(
    (dy: number) => {
      runOnUI((by: number) => {
        'worklet';
        scrollTo(scrollRef, 0, Math.max(0, scrollY.value + by), true);
      })(dy);
    },
    [scrollRef, scrollY],
  );

  if (pathEnrollment == null || calendar == null) return null;

  return (
    <View style={styles.section}>
      <SectionHeader title="Path" />
      <Text style={styles.note}>
        The plan path on a fabricated enrollment. Each button writes what the
        path last saw and remounts it, so the real celebration plays: the path
        appears waiting, scrolls its node into view if needed, then plays.
        Re-open remounts without writing, so nothing should play again. Cold
        load holds the gold back 1.5 s, as a launch with nothing cached would:
        the path should fade in once, gold already on, never blue first.
        Sounds need Sound effects on.
      </Text>
      {PATH_CASES.map((entry, index) => (
        <ChunkyButton
          key={entry.label}
          label={entry.label}
          tone={index === current.index ? undefined : CHUNKY_TONE_QUIET}
          onPress={() => play(index)}
        />
      ))}
      <Text style={styles.label}>{item.caption}</Text>
      <ChunkyButton
        label="Re-open (should not replay)"
        tone={CHUNKY_TONE_QUIET}
        onPress={reopen}
      />
      <ChunkyButton
        label="Cold load (gold arrives late)"
        tone={CHUNKY_TONE_QUIET}
        onPress={() => play(current.index, true)}
      />
      {item.canBuyPro ? (
        <ChunkyButton
          label={current.boughtPro ? 'Back to free' : 'Buy Pro'}
          tone={CHUNKY_TONE_QUIET}
          onPress={() => setCurrent((previous) => ({ ...previous, boughtPro: !previous.boughtPro }))}
        />
      ) : null}
      {seen === undefined || !goldKnown ? null : (
        <PlanPath
          key={`${current.index}:${current.run}`}
          calendar={{ ...calendar, weeks: calendar.weeks.slice(0, PATH_WEEKS) }}
          enrollment={{ ...pathEnrollment, programDay: item.daysDone + 1 }}
          isPro={isPro}
          goldDays={new Set(item.gold)}
          seen={seen}
          revealTop={revealTop}
          onScrollBy={scrollBy}
          fadeIn={current.coldLoad}
        />
      )}
    </View>
  );
}

export default function PlanLabScreen({ navigation }: PlanLabScreenProps) {
  const isDev = __DEV__;
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollY = useSharedValue(0);
  const [scrollTop, setScrollTop] = useState(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  if (!isDev) {
    return null;
  }

  return (
    <View style={styles.screen}>
      <AppTopBar
        showBack
        title="Plan lab"
        showAvatar={false}
        showStreak={false}
      />
      <Animated.ScrollView
        ref={scrollRef}
        onLayout={(event) => setScrollTop(event.nativeEvent.layout.y)}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenContent style={styles.column}>
          <PathLabSection scrollRef={scrollRef} scrollY={scrollY} revealTop={scrollTop} />

          <View style={styles.section}>
            <SectionHeader title="Start empty state" />
            <Text style={styles.note}>
              What an account with no plan sees on the plan tab. To reach the
              live one, clear your plan in the room lab.
            </Text>

            {START_CASES.map((item) => (
              <View key={item.label} style={styles.case}>
                <Text style={styles.label}>{item.label}</Text>
                <PlanStartEmptyState
                  offer={item.offer}
                  onStart={() => {}}
                  isStarting={item.isStarting}
                  hasFailed={item.hasFailed}
                />
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <SectionHeader title="What’s next picker" />
            <ChunkyButton
              label="Preview on Plan tab"
              onPress={() => navigation.navigate('MainTabs', {
                screen: 'Insights',
                params: { previewFinishedPlan: true },
              }, { pop: true })}
            />
            <Text style={styles.note}>
              What a finished plan offers. The plan itself stays on screen
              above it and Home keeps its last day — picking here is the only
              way to start another.
            </Text>

            <View style={styles.case}>
              <Text style={styles.label}>Finished state</Text>
              <PlanFinishedState totalWeeks={6} />
            </View>

            <View style={styles.case}>
              <Text style={styles.label}>The cards, scrolled sideways</Text>
              <PlanChoicePicker
                onStart={() => {}}
                isStarting={false}
                hasFailed={false}
              />
            </View>

            <View style={styles.case}>
              <Text style={styles.label}>Starting</Text>
              <PlanChoicePicker onStart={() => {}} isStarting hasFailed={false} />
            </View>

            <View style={styles.case}>
              <Text style={styles.label}>Failed</Text>
              <PlanChoicePicker
                onStart={() => {}}
                isStarting={false}
                hasFailed
              />
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader title="Analytics card" />
            <Text style={styles.note}>
              The card the plan screen renders, on fabricated data. It locks on
              evidence rather than on time served: the blur lifts as soon as
              either finding has enough days behind it.
            </Text>

            {CASES.map((item) => (
              <View key={item.label} style={styles.case}>
                <Text style={styles.label}>{item.label}</Text>
                <PlanAnalyticsSection
                  review={item.review}
                  daysAnswered={item.daysAnswered}
                  trend={item.trend}
                  reset={item.reset}
                  factors={item.factors}
                />
              </View>
            ))}
          </View>
        </ScreenContent>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  content: {
    paddingBottom: spacing['7xl'],
    gap: margin.sectionGap,
  },
  column: {
    gap: margin.sectionGap,
  },
  section: {
    paddingHorizontal: padding.screen.horizontal,
    gap: spacing.sm,
  },
  case: {
    gap: spacing.sm,
  },
  note: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  label: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
  },
});
