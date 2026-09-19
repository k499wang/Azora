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
import { ScrollView, StyleSheet, View } from 'react-native';
import AppTopBar from '../components/common/AppTopBar';
import ScreenContent from '../components/common/ScreenContent';
import SectionHeader from '../components/common/SectionHeader';
import { Text } from '../components/common/Text';
import PlanAnalyticsSection from '../features/plan/PlanAnalyticsSection';
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

export default function PlanLabScreen(_: PlanLabScreenProps) {
  const isDev = __DEV__;

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
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenContent style={styles.column}>
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
      </ScrollView>
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
