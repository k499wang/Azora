import { useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import type { RootStackNavigationProp } from '../../app/navigation';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { useTodayLocalDate } from '../../hooks/useTodayLocalDate';
import { useCreateSelfCareGoalsMutation } from '../../queries/selfCare/useCreateSelfCareGoalsMutation';
import { useSelfCareGoalsQuery } from '../../queries/selfCare/useSelfCareGoalsQuery';
import { getAzoAssistMessagesUsedQueryKey } from '../../queries/subscriptions/useAzoAssistMessagesUsedQuery';
import {
  trackAzoAssistRequested,
  trackAzoAssistTodosAdded,
  trackFeatureGateHit,
} from '../../services/analytics/tracking';
import {
  AzoAssistAccessError,
  askAzo,
  type AzoChatTurn,
} from '../../services/azoAssist/azoAssistService';
import { PaywallPlacement } from '../../services/paywall';
import { FeatureKey } from '../../services/subscriptions/featureAccess';
import { useAuthStore } from '../../stores/authStore';
import { suggestedTodoDraft, type SuggestedTodo } from './domain/suggestedTodo';

type AzoAssistSurface = 'chat' | 'sparkle' | 'voice_plan';

/** What Ask Azo and Plan with Azo share: today's list as context, the free count, the Pro gate, asking, and saving. */
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
      sourceScreen: surface === 'voice_plan' ? 'AzoPlan' : 'AzoChat',
      sourceAction,
      access,
    });
    navigation.navigate('ProPaywall', {
      placement: PaywallPlacement.AzoAssistProGate,
      sourceScreen: surface === 'voice_plan' ? 'AzoPlan' : 'AzoChat',
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

  /**
   * One answer from Azo, tracked and counted. Null when the server turned it
   * away for access and the paywall has taken over; other failures throw.
   */
  const ask = async (messages: AzoChatTurn[]) => {
    try {
      const answer = await askAzo({ messages, todos: todayTitles });
      trackAzoAssistRequested({ surface, outcome: 'answered' });
      recordFreeMessagesLeft(answer.freeMessagesLeft);
      return answer;
    } catch (error) {
      trackAzoAssistRequested({ surface, outcome: 'failed' });
      if (!(error instanceof AzoAssistAccessError)) throw error;
      refreshFreeMessages();
      openPaywall();
      return null;
    }
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
    /** While access is still loading the server is the gate, so a Pro user is never bounced. */
    blocked: !access.isLoading && !access.allowed,
    freeMessagesLeft,
    openPaywall,
    ask,
    addTodos,
    adding: createGoals.isPending,
    addError: createGoals.error,
  };
}
