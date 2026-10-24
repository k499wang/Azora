import { useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import type { RootStackNavigationProp } from '../../app/navigation';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { useTodayLocalDate } from '../../hooks/useTodayLocalDate';
import { useCreateSelfCareGoalsMutation } from '../../queries/selfCare/useCreateSelfCareGoalsMutation';
import { useSelfCareGoalsQuery } from '../../queries/selfCare/useSelfCareGoalsQuery';
import { getAzoAssistMessagesUsedQueryKey } from '../../queries/subscriptions/useAzoAssistMessagesUsedQuery';
import { trackAzoAssistTodosAdded, trackFeatureGateHit } from '../../services/analytics/tracking';
import { PaywallPlacement } from '../../services/paywall';
import { FeatureKey } from '../../services/subscriptions/featureAccess';
import { useAuthStore } from '../../stores/authStore';
import { suggestedTodoDraft, type SuggestedTodo } from './domain/suggestedTodo';

type AzoAssistSurface = 'chat' | 'sparkle';

/** What Ask Azo and the routine sparkle share: today's list as context, the free count, the Pro gate, and saving. */
export function useAzoAssist(surface: AzoAssistSurface) {
  const navigation = useNavigation<RootStackNavigationProp>();
  const queryClient = useQueryClient();
  const access = useFeatureAccess(FeatureKey.AzoAssist);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const localDate = useTodayLocalDate();
  const goals = useSelfCareGoalsQuery(userId, localDate).data;
  const createGoals = useCreateSelfCareGoalsMutation(userId, localDate);
  const todayTitles = useMemo(() => (goals ?? []).map((goal) => goal.title), [goals]);
  const freeMessagesLeft = access.isLoading || access.isPro || access.limit == null
    ? null
    : Math.max(0, access.limit - access.used);

  /** `upsell` is a tap on a free-count prompt; `ask_azo` is a blocked send. */
  const openPaywall = (sourceAction: 'ask_azo' | 'upsell' = 'ask_azo') => {
    trackFeatureGateHit({
      feature: FeatureKey.AzoAssist,
      placement: PaywallPlacement.AzoAssistProGate,
      sourceScreen: 'AzoChat',
      sourceAction,
      access,
    });
    navigation.navigate('ProPaywall', {
      placement: PaywallPlacement.AzoAssistProGate,
      sourceScreen: 'AzoChat',
      sourceAction,
      feature: FeatureKey.AzoAssist,
    });
  };

  /** The server's count after an answer is the canonical one. */
  const recordFreeMessagesLeft = (left: number | null) => {
    if (left == null || access.limit == null) return;
    queryClient.setQueryData(getAzoAssistMessagesUsedQueryKey(userId), access.limit - left);
  };

  // A 403 also comes from a server without the free path, so it re-reads the count rather than assuming it spent.
  const refreshFreeMessages = () => {
    void queryClient.invalidateQueries({ queryKey: getAzoAssistMessagesUsedQueryKey(userId) });
  };

  const addTodos = (todos: SuggestedTodo[], onSaved?: () => void) => {
    if (todos.length === 0 || createGoals.isPending) return;
    createGoals.mutate(todos.map(suggestedTodoDraft), {
      onSuccess: () => {
        trackAzoAssistTodosAdded({ surface, count: todos.length });
        onSaved?.();
      },
    });
  };

  return {
    access,
    freeMessagesLeft,
    recordFreeMessagesLeft,
    refreshFreeMessages,
    todayTitles,
    openPaywall,
    addTodos,
    adding: createGoals.isPending,
    addError: createGoals.error,
  };
}
