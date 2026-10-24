import { useCallback, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { RootStackNavigationProp } from '../../app/navigation';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { useCreateSelfCareGoalMutation } from '../../queries/selfCare/useCreateSelfCareGoalMutation';
import { trackFeatureGateHit } from '../../services/analytics/tracking';
import { PaywallPlacement } from '../../services/paywall';
import type { SelfCareGoalDraft } from '../../services/selfCare/selfCareService';
import { FeatureKey } from '../../services/subscriptions/featureAccess';

/** The add sheet for a day's to-dos, behind the to-do limit's paywall gate. */
export function useAddGoalSheet(userId: string | null, localDate: string) {
  const navigation = useNavigation<RootStackNavigationProp>();
  const createGoal = useCreateSelfCareGoalMutation(userId, localDate);
  const todoAccess = useFeatureAccess(FeatureKey.RoutineTodos);
  const [adding, setAdding] = useState(false);

  // Stable while access is, so the memoised list it is handed to does not
  // re-render with every update to the screen around it.
  const open = useCallback(() => {
    if (!todoAccess.allowed && !todoAccess.isLoading) {
      const gate = {
        feature: FeatureKey.RoutineTodos,
        placement: PaywallPlacement.RoutineTodoLimitProGate,
        sourceScreen: 'Plan',
        sourceAction: 'add_todo',
      };
      trackFeatureGateHit({ ...gate, access: todoAccess });
      navigation.navigate('ProPaywall', gate);
      return;
    }
    setAdding(true);
  }, [navigation, todoAccess]);

  const close = () => {
    setAdding(false);
    createGoal.reset();
  };

  const submit = (draft: SelfCareGoalDraft) => {
    if (createGoal.isPending) return;
    createGoal.mutate(draft, { onSuccess: () => setAdding(false) });
  };

  return {
    open,
    sheet: {
      visible: adding,
      onClose: close,
      onSubmit: submit,
      pending: createGoal.isPending,
      error: createGoal.error,
    },
  };
}
