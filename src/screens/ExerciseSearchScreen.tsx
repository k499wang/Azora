import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  InteractionManager,
  Pressable,
  ScrollView,
  StyleSheet,
  type TextInput,
  View,
} from 'react-native';
import { usePostHog } from 'posthog-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ExerciseSearchScreenProps } from '../app/navigation';
import { Text } from '../components/common/Text';
import ExerciseSearchBar from '../components/explore/ExerciseSearchBar';
import ExerciseSearchResultRow from '../components/explore/ExerciseSearchResultRow';
import {
  searchExerciseCatalog,
  type ExerciseSearchFilter,
} from '../components/explore/exerciseCatalog';
import TechniqueCard from '../components/explore/TechniqueCard';
import { useRecommendedTechnique } from '../features/exercise/guidedBreathing/hooks/useRecommendedTechnique';
import { BREATH_HOLD_STYLE } from '../features/exercise/guidedBreathing/categoryPalette';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { useTodayLocalDate } from '../hooks/useTodayLocalDate';
import { matchesDailyExerciseSearch, normalizeExerciseSearch } from '../lib/exerciseSearch';
import { deriveHoldStats } from '../lib/holdStats';
import { useHomeStatsQuery } from '../queries/tracking/useHomeStatsQuery';
import { AnalyticsEvent } from '../services/analytics/events';
import { trackFeatureGateHit } from '../services/analytics/tracking';
import { PaywallPlacement } from '../services/paywall';
import { FeatureKey } from '../services/subscriptions/featureAccess';
import { useAuthStore } from '../stores/authStore';
import ScreenContent from '../components/common/ScreenContent';
import { contentColumn } from '../theme/breakpoints';
import { colors } from '../theme/colors';
import { padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';

const SEARCH_DEBOUNCE_MS = 250;
const SEARCH_FILTERS: ReadonlyArray<{
  id: ExerciseSearchFilter;
  label: string;
}> = [
  { id: 'all', label: 'All' },
  { id: 'calm', label: 'Calm' },
  { id: 'sleep', label: 'Sleep' },
  { id: 'focus', label: 'Focus' },
  { id: 'energy', label: 'Energy' },
  { id: 'balance', label: 'Balance' },
  { id: 'breath-hold', label: 'Protocol' },
];

function formatHoldTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
}

export default function ExerciseSearchScreen({
  navigation,
}: ExerciseSearchScreenProps) {
  const [draftQuery, setDraftQuery] = useState('');
  const [committedQuery, setCommittedQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<ExerciseSearchFilter>('all');
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  const posthog = usePostHog();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const todayLocalDate = useTodayLocalDate();
  const homeStatsQuery = useHomeStatsQuery(userId, todayLocalDate);
  const recommendedTechnique = useRecommendedTechnique(userId);
  const dailyExerciseAccess = useFeatureAccess(FeatureKey.DailyExercise);
  const recommendedTechniqueId =
    recommendedTechnique.source === 'profile'
      ? recommendedTechnique.technique?.id ?? null
      : null;
  const normalizedDraftQuery = normalizeExerciseSearch(draftQuery);
  const normalizedCommittedQuery = normalizeExerciseSearch(committedQuery);
  const hasQuery = normalizedCommittedQuery.length > 0;
  const isSearching = normalizedDraftQuery !== normalizedCommittedQuery;
  const dailyQueryMatches = matchesDailyExerciseSearch(committedQuery);
  const dailyMatches = selectedFilter === 'breath-hold'
    ? !hasQuery || dailyQueryMatches
    : selectedFilter === 'all' && hasQuery && dailyQueryMatches;
  const matchingTechniques = useMemo(
    () => searchExerciseCatalog(
      committedQuery,
      recommendedTechniqueId,
      selectedFilter,
    ),
    [committedQuery, recommendedTechniqueId, selectedFilter],
  );
  const stats = homeStatsQuery.data;
  const holdStats = deriveHoldStats(stats?.dailyActivity, todayLocalDate);
  const showInitialPrompt = !hasQuery && selectedFilter === 'all';
  const noResults =
    !showInitialPrompt && !dailyMatches && matchingTechniques.length === 0;
  const todayHoldSeconds = stats?.todayBreathHold?.holdSeconds ?? null;
  const dailyStatus = todayHoldSeconds != null
    ? `Done today ${formatHoldTime(todayHoldSeconds)}`
    : holdStats.lastHoldSeconds != null
      ? `Last hold ${formatHoldTime(holdStats.lastHoldSeconds)}`
      : null;
  const dailyMetadata = dailyStatus == null ? '~2 min' : `~2 min · ${dailyStatus}`;

  useEffect(() => {
    if (normalizedDraftQuery === normalizedCommittedQuery) return;

    const timeout = setTimeout(() => {
      setCommittedQuery(draftQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [draftQuery, normalizedCommittedQuery, normalizedDraftQuery]);

  useFocusEffect(
    useCallback(() => {
      const focusTask = InteractionManager.runAfterInteractions(() => {
        inputRef.current?.focus();
      });

      return () => focusTask.cancel();
    }, []),
  );

  const startDailyBreathHold = useCallback(() => {
    posthog.capture(AnalyticsEvent.DailyPlanStarted, {
      streak_days: stats?.streak?.currentStreak ?? 0,
    });

    if (!dailyExerciseAccess.allowed && !dailyExerciseAccess.isLoading) {
      trackFeatureGateHit({
        feature: FeatureKey.DailyExercise,
        placement: PaywallPlacement.ExercisePremiumGate,
        sourceScreen: 'ExerciseSearch',
        sourceAction: 'exercise_search_daily',
        access: dailyExerciseAccess,
      });
      navigation.navigate('ProPaywall', {
        placement: PaywallPlacement.ExercisePremiumGate,
        sourceScreen: 'ExerciseSearch',
        sourceAction: 'exercise_search_daily',
        feature: FeatureKey.DailyExercise,
      });
      return;
    }

    navigation.navigate('DailyExercise');
  }, [dailyExerciseAccess, navigation, posthog, stats?.streak?.currentStreak]);

  const clearSearch = useCallback(() => {
    setDraftQuery('');
    setCommittedQuery('');
  }, []);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <ExerciseSearchBar
            mode="editable"
            onBack={() => navigation.goBack()}
            value={draftQuery}
            onChangeText={setDraftQuery}
            onClear={clearSearch}
            inputRef={inputRef}
            autoFocus
          />
        </View>
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel="Exercise categories"
          style={styles.filtersWrap}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
            keyboardShouldPersistTaps="handled"
          >
            {SEARCH_FILTERS.map((filter) => {
              const selected = filter.id === selectedFilter;

              return (
                <Pressable
                  key={filter.id}
                  accessibilityRole="button"
                  accessibilityLabel={filter.label}
                  accessibilityState={{ selected }}
                  onPress={() => setSelectedFilter(filter.id)}
                  style={({ pressed }) => [
                    styles.filterChip,
                    selected ? styles.filterChipSelected : styles.filterChipDefault,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selected
                        ? styles.filterChipTextSelected
                        : styles.filterChipTextDefault,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>

      <ScrollView
        style={styles.results}
        contentContainerStyle={styles.resultsContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <ScreenContent style={styles.column}>
          {isSearching ? (
            <View
              accessible
              accessibilityLiveRegion="polite"
              accessibilityLabel="Searching resets"
              style={styles.searching}
            >
              <ActivityIndicator size="small" color={colors.primary.blue600} />
              <Text style={styles.searchingText}>Searching…</Text>
            </View>
          ) : showInitialPrompt ? (
            <View style={styles.prompt}>
              <MaterialCommunityIcons
                name="magnify"
                size={30}
                color={colors.text.tertiary}
              />
              <Text style={styles.promptTitle}>Find an exercise</Text>
              <Text style={styles.promptBody}>
                Search by exercise name or category.
              </Text>
            </View>
          ) : (
            <>
              {dailyMatches ? (
                <ExerciseSearchResultRow
                  title="The Azora Protocol"
                  metadata={dailyMetadata}
                  hue={BREATH_HOLD_STYLE.hue}
                  glyph={BREATH_HOLD_STYLE.glyph}
                  accessibilityLabel={`The Azora Protocol, ${dailyMetadata}`}
                  accessibilityHint={
                    !dailyExerciseAccess.allowed && !dailyExerciseAccess.isLoading
                      ? 'Opens the Pro upgrade screen'
                      : 'Starts The Azora Protocol'
                  }
                  onPress={startDailyBreathHold}
                />
              ) : null}

              {matchingTechniques.map((technique) => (
                <TechniqueCard
                  key={technique.id}
                  technique={technique}
                  recommended={technique.id === recommendedTechniqueId}
                  exerciseAccess={dailyExerciseAccess}
                  layout="search"
                  sourceScreen="ExerciseSearch"
                  sourceAction="exercise_search_result"
                />
              ))}

              {noResults ? (
                <View
                  accessible
                  accessibilityLiveRegion="polite"
                  accessibilityLabel="No resets found. Try another search or category."
                  style={styles.noResults}
                >
                  <Text style={styles.noResultsTitle}>No exercises found</Text>
                  <Text style={styles.noResultsBody}>
                    Try another search or category.
                  </Text>
                </View>
              ) : null}
            </>
          )}
        </ScreenContent>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Carries the results list's gap, which no longer reaches past this wrapper
  // to the rows inside it.
  column: {
    gap: spacing.md,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  header: {
    backgroundColor: colors.background.canvas,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  headerRow: {
    ...contentColumn,
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: padding.screen.horizontal,
    paddingVertical: spacing.sm,
  },
  buttonPressed: {
    opacity: 0.6,
  },
  filtersWrap: {
    ...contentColumn,
    paddingBottom: spacing.sm,
  },
  filtersContent: {
    paddingHorizontal: padding.screen.horizontal,
    gap: spacing.sm,
  },
  filterChip: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  filterChipSelected: {
    backgroundColor: colors.primary.blue600,
    borderColor: colors.primary.blue600,
  },
  filterChipDefault: {
    backgroundColor: colors.background.elevated,
    borderColor: colors.border.subtle,
  },
  filterChipText: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
  },
  filterChipTextSelected: {
    color: colors.text.inverse,
  },
  filterChipTextDefault: {
    color: colors.text.secondary,
  },
  results: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: padding.screen.horizontal,
    paddingTop: spacing.lg,
    paddingBottom: spacing['7xl'] + spacing.xl,
    gap: spacing.md,
  },
  prompt: {
    alignItems: 'center',
    paddingTop: spacing['4xl'],
    gap: spacing.xs,
  },
  promptTitle: {
    ...typography.title.title3,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    textAlign: 'center',
  },
  promptBody: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  searching: {
    alignItems: 'center',
    paddingTop: spacing['4xl'],
    gap: spacing.sm,
  },
  searchingText: {
    ...typography.body.medium,
    color: colors.text.secondary,
    fontFamily: fonts.medium,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    gap: spacing.xs,
  },
  noResultsTitle: {
    ...typography.title.title3,
    color: colors.text.primary,
    fontFamily: fonts.semibold,
    textAlign: 'center',
  },
  noResultsBody: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
