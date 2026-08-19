import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import SectionHeader from '../components/common/SectionHeader';
import { Text } from '../components/common/Text';
import HistoryDayRow from '../components/history/HistoryDayRow';
import HistoryEarnedCard from '../components/history/HistoryEarnedCard';
import HistoryEmptyDay from '../components/history/HistoryEmptyDay';
import HistoryHeader from '../components/history/HistoryHeader';
import HistoryTodayButton from '../components/history/HistoryTodayButton';
import { colors } from '../theme/colors';
import { margin, padding, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { useAuthStore } from '../stores/authStore';
import { useTodayLocalDate } from '../hooks/useTodayLocalDate';
import { useDailiesCompletion } from '../hooks/useDailiesCompletion';
import { useStartDaily } from '../hooks/useStartDaily';
import { useDayHistoryQuery } from '../queries/history/useDayHistoryQuery';
import { useDailyActivityRangeQuery } from '../queries/tracking/useDailyActivityRangeQuery';
import {
  buildWeekCalendarDays,
  getCompletedDaysAgoFromActivityDates,
  parseLocalDate,
} from '../lib/calendar/weekCalendarDays';
import {
  getTechnique,
  type BreathingTechnique,
} from '../features/exercise/guidedBreathing/techniques';
import {
  BREATH_HOLD_STYLE,
  CATEGORY_STYLE,
  TECHNIQUE_GLYPH,
} from '../features/exercise/guidedBreathing/categoryPalette';
import { formatProfileDuration } from '../lib/profileStatsFormat';
import { formatProfileHoldTime } from '../services/profile/profileSummaryService';
import type { HistoryScreenProps } from '../app/navigation';
import type { DayHistory } from '../services/history/dayHistoryService';
import type { BreathingSessionSummary } from '../services/tracking/types';

/** four weeks back, which is also what `daily_activity` is read for elsewhere */
const HISTORY_DAYS = 28;

const HEART_RATE_HUE = colors.playful.blush;

function formatDayTitle(localDate: string, todayLocalDate: string): string {
  const date = parseLocalDate(localDate);
  const short = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  if (localDate === todayLocalDate) return `Today, ${short}`;

  return `${date.toLocaleDateString('en-US', { weekday: 'short' })}, ${short}`;
}

function formatTimeOfDay(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function joinMeta(parts: Array<string | null | undefined>): string {
  return parts.filter(Boolean).join(' · ');
}

function techniqueMeta(
  technique: BreathingTechnique,
  session: BreathingSessionSummary | undefined,
): string {
  return joinMeta([
    CATEGORY_STYLE[technique.category].label,
    session == null
      ? technique.duration
      : formatProfileDuration(session.durationSeconds),
    session == null ? null : formatTimeOfDay(session.startedAt),
  ]);
}

function heartRateMeta(
  session: DayHistory['heartRateSessions'][number],
): string {
  return joinMeta([
    formatTimeOfDay(session.startedAt),
    session.avgBpm == null ? null : `${session.avgBpm} bpm`,
    session.rmssd == null ? null : `HRV ${Math.round(session.rmssd)}`,
  ]);
}

export default function HistoryScreen({
  navigation,
  route,
}: HistoryScreenProps) {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const todayLocalDate = useTodayLocalDate();
  const [selectedLocalDate, setSelectedLocalDate] = useState(
    route.params?.date ?? todayLocalDate,
  );
  const isToday = selectedLocalDate === todayLocalDate;
  const [jumpToLatestToken, setJumpToLatestToken] = useState(0);

  const jumpToToday = useCallback(() => {
    setSelectedLocalDate(todayLocalDate);
    setJumpToLatestToken((token) => token + 1);
  }, [todayLocalDate]);

  const activityRangeQuery = useDailyActivityRangeQuery(userId, HISTORY_DAYS);
  const dayQuery = useDayHistoryQuery(userId, selectedLocalDate);
  // Only today renders a plan, and this hook fans out to roughly nine queries
  // (profile, recommendation, plan, completions, and all of Home's stats).
  // Passing null on a past day leaves every one of them disabled; they stay
  // cached under the real user id, so coming back to today is instant.
  const dailies = useDailiesCompletion(isToday ? userId : null);
  const { start } = useStartDaily('History', dailies);

  const days = useMemo(() => {
    const completedDaysAgo = getCompletedDaysAgoFromActivityDates(
      activityRangeQuery.data ?? [],
      parseLocalDate(todayLocalDate),
      HISTORY_DAYS,
    );
    // Pad past today to the end of its week so the strip breaks on Saturdays
    // the way a calendar does, instead of on a rolling 28-day edge.
    const trailingDays = 6 - parseLocalDate(todayLocalDate).getDay();

    return buildWeekCalendarDays(
      todayLocalDate,
      completedDaysAgo,
      HISTORY_DAYS,
      HISTORY_DAYS - 1 - trailingDays,
    );
  }, [activityRangeQuery.data, todayLocalDate]);

  // Everything below reads `day`, which is null until the *selected* date has
  // loaded. Rendering off a day that describes another date is how a loaded day
  // flashes as "nothing logged" and how one day's heart-rate rows show up under
  // another day's header.
  const day =
    dayQuery.data?.localDate === selectedLocalDate ? dayQuery.data : null;
  const breathHold = day?.breathHold ?? null;
  const breathingSessions = day?.breathingSessions ?? [];
  const heartRateSessions = day?.heartRateSessions ?? [];
  const earnedDecorations = day?.earnedDecorations ?? [];
  const hasPartialError =
    day != null && Object.values(day.partialErrors).some(Boolean);
  // Today always has a plan to show, so only a past day can come up empty.
  const isEmptyDay =
    !isToday &&
    day != null &&
    breathingSessions.length === 0 &&
    breathHold == null &&
    heartRateSessions.length === 0 &&
    earnedDecorations.length === 0;
  const isLoadingDay = !isToday && day == null && !dayQuery.isError;
  const showCentered = !isToday && (isEmptyDay || isLoadingDay || dayQuery.isError);

  const sessionFor = (techniqueId: string | undefined) =>
    breathingSessions.find((session) => session.techniqueId === techniqueId);

  const holdMeta = joinMeta([
    BREATH_HOLD_STYLE.label,
    breathHold == null
      ? null
      : `Held ${formatProfileHoldTime(breathHold.holdSeconds)}`,
    breathHold == null ? null : formatTimeOfDay(breathHold.startedAt),
  ]);

  const pastRows = breathingSessions
    .map((session) => ({ session, technique: getTechnique(session.techniqueId) }))
    .filter(
      (row): row is { session: BreathingSessionSummary; technique: BreathingTechnique } =>
        row.technique != null,
    );

  const renderTechniqueRow = (
    technique: BreathingTechnique | null,
    fallbackTitle: string,
    completed: boolean,
    onPress: (() => void) | undefined,
  ) => {
    const style = technique
      ? CATEGORY_STYLE[technique.category]
      : CATEGORY_STYLE.calm;

    return (
      <HistoryDayRow
        glyph={technique ? TECHNIQUE_GLYPH[technique.id] : style.glyph}
        hue={style.hue}
        title={technique?.name ?? fallbackTitle}
        meta={
          technique == null
            ? undefined
            : techniqueMeta(technique, sessionFor(technique.id))
        }
        completed={completed}
        onPress={onPress}
      />
    );
  };

  return (
    <View style={styles.screen}>
      <HistoryHeader
        title={formatDayTitle(selectedLocalDate, todayLocalDate)}
        days={days}
        selectedLocalDate={selectedLocalDate}
        onSelect={setSelectedLocalDate}
        onClose={() => navigation.goBack()}
        jumpToLatestToken={jumpToLatestToken}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          showCentered && styles.scrollContentCentered,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {showCentered ? (
          isLoadingDay ? (
            <ActivityIndicator color={colors.text.tertiary} />
          ) : dayQuery.isError ? (
            <HistoryEmptyDay message="Couldn’t load this day" />
          ) : (
            <HistoryEmptyDay message="No activities for this day" />
          )
        ) : (
          <>
            {hasPartialError ? (
              <Text style={styles.partialError}>
                Some of this day may be out of date.
              </Text>
            ) : null}

            <View style={styles.section}>
              <SectionHeader icon="calendar" title="What you did" />

              <View style={styles.rows}>
                {isToday ? (
                  <>
                    {renderTechniqueRow(
                      dailies.guidedTechnique,
                      'Your breathing exercise',
                      dailies.guidedCompleted,
                      dailies.guidedCompleted || dailies.guidedTechnique == null
                        ? undefined
                        : () => start('guided'),
                    )}
                    {renderTechniqueRow(
                      dailies.handPickedTechnique,
                      'Azora’s daily pick',
                      dailies.handPickedCompleted,
                      dailies.handPickedCompleted ||
                        dailies.handPickedTechnique == null
                        ? undefined
                        : () => start('handPicked'),
                    )}
                    <HistoryDayRow
                      glyph={BREATH_HOLD_STYLE.glyph}
                      hue={BREATH_HOLD_STYLE.hue}
                      title="Daily Breathhold"
                      meta={holdMeta}
                      completed={dailies.breathHoldCompleted}
                      onPress={
                        dailies.breathHoldCompleted
                          ? undefined
                          : () => start('breathHold')
                      }
                    />
                  </>
                ) : (
                  <>
                    {pastRows.map(({ session, technique }) => (
                      <HistoryDayRow
                        key={session.sessionId}
                        glyph={TECHNIQUE_GLYPH[technique.id]}
                        hue={CATEGORY_STYLE[technique.category].hue}
                        title={technique.name}
                        meta={techniqueMeta(technique, session)}
                        completed
                      />
                    ))}
                    {breathHold == null ? null : (
                      <HistoryDayRow
                        glyph={BREATH_HOLD_STYLE.glyph}
                        hue={BREATH_HOLD_STYLE.hue}
                        title="Daily Breathhold"
                        meta={holdMeta}
                        completed
                      />
                    )}
                  </>
                )}
              </View>
            </View>

            {heartRateSessions.length === 0 ? null : (
              <View style={styles.section}>
                <SectionHeader icon="heart" title="Heart rate" />
                <View style={styles.rows}>
                  {heartRateSessions.map((session) => (
                    <HistoryDayRow
                      key={session.sessionId}
                      glyph="ripple"
                      hue={HEART_RATE_HUE}
                      title="Heart rate check"
                      meta={heartRateMeta(session)}
                      completed
                      onPress={() =>
                        navigation.navigate('HeartRateSessionDetail', {
                          sessionId: session.sessionId,
                        })
                      }
                    />
                  ))}
                </View>
              </View>
            )}

            {earnedDecorations.length === 0 ? null : (
              <View style={styles.section}>
                <SectionHeader icon="room-hex" title="Earned" />
                {earnedDecorations.map((decoration) => (
                  <HistoryEarnedCard
                    key={`${decoration.slot}-${decoration.optionId}`}
                    decoration={decoration}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {isToday ? null : <HistoryTodayButton onPress={jumpToToday} />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: padding.screen.horizontal,
    paddingTop: spacing.lg,
    paddingBottom: spacing['7xl'],
    gap: margin.sectionGap,
  },
  scrollContentCentered: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partialError: {
    ...typography.body.small,
    color: colors.text.tertiary,
  },
  section: {
    gap: spacing.md,
  },
  rows: {
    gap: spacing.sm,
  },
});
