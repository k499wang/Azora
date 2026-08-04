import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
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
import SectionHeader from '../components/common/SectionHeader';
import { Text } from '../components/common/Text';
import DailyPlanCard from '../components/explore/DailyPlanCard';
import ExerciseSearchBar from '../components/explore/ExerciseSearchBar';
import { searchExerciseCatalog } from '../components/explore/exerciseCatalog';
import TechniqueCard from '../components/explore/TechniqueCard';
import { useRecommendedTechnique } from '../features/exercise/guidedBreathing/hooks/useRecommendedTechnique';
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
import { colors } from '../theme/colors';
import { padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';

export default function ExerciseSearchScreen({
  navigation,
}: ExerciseSearchScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
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
  const normalizedQuery = normalizeExerciseSearch(searchQuery);
  const hasQuery = normalizedQuery.length > 0;
  const dailyMatches = hasQuery && matchesDailyExerciseSearch(searchQuery);
  const matchingTechniques = useMemo(
    () => searchExerciseCatalog(searchQuery, recommendedTechniqueId),
    [recommendedTechniqueId, searchQuery],
  );
  const stats = homeStatsQuery.data;
  const holdStats = deriveHoldStats(stats?.dailyActivity, todayLocalDate);
  const noResults = hasQuery && !dailyMatches && matchingTechniques.length === 0;

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

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            accessibilityHint="Returns to Explore"
            hitSlop={4}
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={30}
              color={colors.text.primary}
            />
          </Pressable>
          <ExerciseSearchBar
            mode="editable"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={() => setSearchQuery('')}
            inputRef={inputRef}
            autoFocus
          />
        </View>
      </View>

      <ScrollView
        style={styles.results}
        contentContainerStyle={styles.resultsContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {!hasQuery ? (
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
            <SectionHeader title="Results" />

            {dailyMatches ? (
              <View style={styles.dailyResult}>
                <DailyPlanCard
                  todayHoldSeconds={stats?.todayBreathHold?.holdSeconds ?? null}
                  lastHoldSeconds={holdStats.lastHoldSeconds}
                  onPress={startDailyBreathHold}
                />
              </View>
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
                accessibilityLabel="No exercises found. Try a different name or category."
                style={styles.noResults}
              >
                <Text style={styles.noResultsTitle}>No exercises found</Text>
                <Text style={styles.noResultsBody}>
                  Try a different name or category.
                </Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.accentSoft,
  },
  header: {
    backgroundColor: colors.background.accentSoft,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  headerRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.xs,
    paddingRight: padding.screen.horizontal,
    paddingVertical: spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  buttonPressed: {
    opacity: 0.6,
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
  dailyResult: {
    marginBottom: spacing.xs,
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
