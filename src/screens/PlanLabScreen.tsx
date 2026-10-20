/** Developer previews of the live plan and mood insights components. */
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
import { startUiTimer } from '../lib/ui/uiThreadTimer';
import { planCalendar } from '../features/plan/domain/planCalendar';
import type { PlanStartOffer } from '../features/plan/domain/planStart';
import {
  PROGRAM_NAME,
  latestProgramPreset,
  type ProgramPlanId,
} from '../features/program/domain/programCatalogue';
import { buildProgramEnrollment } from '../features/program/domain/programEnrollment';
import { useMoodInsights } from '../features/plan/useMoodInsights';
import type { AnalyticsCheckIn } from '../features/plan/domain/moodAnalytics';
import type { PlanLabScreenProps } from '../app/navigation';
import { colors } from '../theme/colors';
import { margin, padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';

const ANALYTICS_TODAY = '2026-10-19';
const ANALYTICS_CASES: { label: string; checkIns: AnalyticsCheckIn[] }[] = [
  { label: 'No check-ins yet', checkIns: [] },
  { label: 'First mood and feeling', checkIns: [
    { localDate: ANALYTICS_TODAY, score: 75, answers: { overall: 4 }, feeling: 'calm', tags: ['rest', 'alone', 'home'] },
  ] },
  { label: 'Feelings across activities, people, and places', checkIns: [
    { localDate: ANALYTICS_TODAY, score: 75, answers: { overall: 4 }, feeling: 'calm', tags: ['walk', 'partner', 'outdoors'] },
    { localDate: '2026-10-18', score: 25, answers: { overall: 2 }, feeling: 'overwhelmed', tags: ['work', 'coworkers', 'workplace'] },
    { localDate: '2026-10-17', score: 50, answers: { overall: 3 }, feeling: 'tired', tags: ['study', 'alone', 'home'] },
    { localDate: '2026-10-16', score: 100, answers: { overall: 5 }, feeling: 'happy', tags: ['friends', 'cafe'] },
    { localDate: '2026-10-12', score: 75, answers: { overall: 4 }, feeling: 'calm', tags: ['exercise', 'alone', 'gym'] },
    { localDate: '2026-09-10', score: 25, answers: { overall: 2 }, feeling: 'overwhelmed', tags: ['study', 'school'] },
  ] },
];

function AnalyticsLabSection({ checkIns }: { checkIns: AnalyticsCheckIn[] }) {
  return <PlanAnalyticsSection insights={useMoodInsights(checkIns, ANALYTICS_TODAY)} />;
}

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
  /** Offers buying Pro to show the newly available day. */
  canBuyPro?: boolean;
}

const PATH_CASES: PathCase[] = [
  {
    label: 'Completed day 5 (plain)',
    caption: 'Day 5 immediately shows its checkmark on a plain coin.',
    daysDone: 5,
    finishedToday: true,
    isPro: true,
    gold: [],
  },
  {
    label: 'Completed day 5 (gold)',
    caption: 'Days 1 to 5 immediately show gold checkmarked coins.',
    daysDone: 5,
    finishedToday: true,
    isPro: true,
    gold: days(1, 5),
  },
  {
    label: 'Available day 6',
    caption: 'Day 6 and its trail are available immediately; today keeps its idle hop.',
    daysDone: 5,
    finishedToday: false,
    isPro: true,
    gold: [],
  },
  {
    label: 'Available day 8',
    caption: 'Day 8 starts week 2 and is available immediately.',
    daysDone: 7,
    finishedToday: false,
    isPro: true,
    gold: [],
  },
  {
    label: 'Locked week',
    caption: 'Day 7 is complete and day 8 stays locked until Pro is available.',
    daysDone: 7,
    finishedToday: false,
    isPro: false,
    gold: [],
    canBuyPro: true,
  },
  {
    label: 'Gold week with a gap',
    caption: 'Day 5 broke the run and looks like any other done coin.',
    daysDone: 10,
    finishedToday: false,
    isPro: true,
    gold: [...days(1, 4), ...days(6, 10)],
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

interface PathLabProps {
  scrollRef: AnimatedRef<Animated.ScrollView>;
  scrollY: SharedValue<number>;
  revealTop: number;
}

function PathLabSection({ scrollRef, scrollY, revealTop }: PathLabProps) {
  const [current, setCurrent] = useState<PathRun>({
    index: RESTING_CASE,
    run: 0,
    boughtPro: false,
    coldLoad: false,
  });
  const [goldRun, setGoldRun] = useState<number | null>(null);

  const item = PATH_CASES[current.index];
  const isPro = item.isPro || current.boughtPro;
  const calendar = planCalendar(PATH_PLAN, item.daysDone, item.finishedToday);
  const goldKnown = !current.coldLoad || goldRun === current.run;

  useEffect(() => {
    if (!current.coldLoad) return undefined;
    const { run } = current;
    return startUiTimer(COLD_GOLD_MS, () => setGoldRun(run));
  }, [current]);

  const showCase = useCallback((index: number, coldLoad = false) => {
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
        The plan path on a fabricated enrollment. Each button shows the current
        completed, gold, available, and locked states immediately. Today keeps
        its idle hop; completions and day unlocks have no animation. Cold
        load holds the gold back 1.5 s, as a launch with nothing cached would:
        a loading message appears, then the path mounts once with gold already on.
      </Text>
      {PATH_CASES.map((entry, index) => (
        <ChunkyButton
          key={entry.label}
          label={entry.label}
          tone={index === current.index ? undefined : CHUNKY_TONE_QUIET}
          onPress={() => showCase(index)}
        />
      ))}
      <Text style={styles.label}>{item.caption}</Text>
      <ChunkyButton
        label="Re-open path"
        tone={CHUNKY_TONE_QUIET}
        onPress={reopen}
      />
      <ChunkyButton
        label="Cold load (gold arrives late)"
        tone={CHUNKY_TONE_QUIET}
        onPress={() => showCase(current.index, true)}
      />
      {item.canBuyPro ? (
        <ChunkyButton
          label={current.boughtPro ? 'Back to free' : 'Buy Pro'}
          tone={CHUNKY_TONE_QUIET}
          onPress={() => setCurrent((previous) => ({ ...previous, boughtPro: !previous.boughtPro }))}
        />
      ) : null}
      {!goldKnown ? <Text style={styles.note}>Loading your plan…</Text> : (
        <PlanPath
          key={`${current.index}:${current.run}`}
          calendar={{ ...calendar, weeks: calendar.weeks.slice(0, PATH_WEEKS) }}
          enrollment={{ ...pathEnrollment, programDay: item.daysDone + 1 }}
          isPro={isPro}
          goldDays={new Set(item.gold)}
          revealTop={revealTop}
          onScrollBy={scrollBy}
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
          <PathLabSection
            scrollRef={scrollRef}
            scrollY={scrollY}
            revealTop={scrollTop}
          />

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
              The profile insights, on fabricated data. Available insights show
              immediately, aggregated across all time.
            </Text>

            {ANALYTICS_CASES.map((item) => (
              <View key={item.label} style={styles.case}>
                <Text style={styles.label}>{item.label}</Text>
                <AnalyticsLabSection checkIns={item.checkIns} />
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
