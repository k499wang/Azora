import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import type { RootStackNavigationProp } from '../../app/navigation';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { useTodayLocalDate } from '../../hooks/useTodayLocalDate';
import { useArchiveSelfCareGoalMutation } from '../../queries/selfCare/useArchiveSelfCareGoalMutation';
import { useCreateSelfCareGoalsMutation } from '../../queries/selfCare/useCreateSelfCareGoalsMutation';
import { useSelfCareGoalsQuery } from '../../queries/selfCare/useSelfCareGoalsQuery';
import { useUpdateSelfCareGoalMutation } from '../../queries/selfCare/useUpdateSelfCareGoalMutation';
import { getAzoAssistMessagesUsedQueryKey } from '../../queries/subscriptions/useAzoAssistMessagesUsedQuery';
import {
  trackAzoAssistRequested,
  trackAzoAssistTodosAdded,
  trackAzoAssistTodosChanged,
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
import type { SuggestedTodo } from './domain/suggestedTodo';
import type { TodoChange } from './domain/todoChange';

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
  const updateGoal = useUpdateSelfCareGoalMutation(userId, localDate);
  const archiveGoal = useArchiveSelfCareGoalMutation(userId, localDate);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<unknown>(null);
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
      const answer = await askAzo({ messages, goals: goals ?? [] });
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

  /**
   * Changes first, then new to-dos. A to-do finished or removed elsewhere since
   * Azo answered is left alone, which also makes a retry after a failure safe:
   * what already went through is skipped or rewritten to the same thing.
   */
  const save = async (todos: SuggestedTodo[], changes: TodoChange[], onSaved?: () => void) => {
    if ((todos.length === 0 && changes.length === 0) || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const open = new Set((goals ?? []).filter((goal) => !goal.completedToday).map((goal) => goal.id));
      const live = changes.filter((change) => open.has(change.goal.id));
      for (const change of live) {
        if (change.kind === 'remove') await archiveGoal.mutateAsync(change.goal.id);
        else await updateGoal.mutateAsync({ goalId: change.goal.id, previousRecurrence: change.goal.recurrence, ...change.draft });
      }
      if (todos.length > 0) await createGoals.mutateAsync(todos);
      if (live.length > 0) {
        trackAzoAssistTodosChanged({
          surface,
          removed: live.filter((change) => change.kind === 'remove').length,
          updated: live.filter((change) => change.kind === 'update').length,
        });
      }
      if (todos.length > 0) trackAzoAssistTodosAdded({ surface, count: todos.length });
      onSaved?.();
    } catch (error) {
      setSaveError(error);
    } finally {
      setSaving(false);
    }
  };

  return {
    access,
    /** While access is still loading the server is the gate, so a Pro user is never bounced. */
    blocked: !access.isLoading && !access.allowed,
    freeMessagesLeft,
    openPaywall,
    ask,
    save,
    saving,
    saveError,
  };
}
