import { useMutation, useQueryClient } from '@tanstack/react-query';
import { startProgramEnrollment } from '../../services/program/programEnrollmentService';
import { PROGRAM_PRESET_REVISION } from '../../features/program/domain/programCatalogue';
import { PLAN_GENERATING_MS } from '../../features/plan/domain/planStart';
import type { ProgramPlanId } from '../../features/program/domain/programCatalogue';
import { getProgramEnrollmentQueryKey } from './useProgramEnrollmentQuery';
import { getProgramDayCompletionsQueryKeyPrefix } from './useProgramDayCompletionsQuery';

export interface StartPlanInput {
  planId: ProgramPlanId;
  /** The user's local date, `YYYY-MM-DD`. Day one is today. */
  enrolledOn: string;
}

/**
 * Starting a plan from the plan screen, for an account that never got one.
 *
 * The same call onboarding makes at the seal — see `planStartOffer` for why
 * the choice is resolved the same way too. The difference is what happens when
 * it fails: onboarding swallows the error because a user stuck on the sealing
 * screen is worse than a user with no plan, whereas here the card is the whole
 * interaction and a silent failure would leave somebody tapping a button that
 * appears to do nothing.
 */
export function useStartProgramEnrollmentMutation(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planId, enrolledOn }: StartPlanInput) => {
      if (userId == null) {
        throw new Error('Cannot start a plan without a signed-in user.');
      }

      // Held open for the length of the generating bar, the way onboarding
      // holds its sealing screen. The insert is one round trip and can beat
      // the bar to the finish, and a plan that appears instantly reads as a
      // screen that changed rather than a plan that was made.
      const [enrollment] = await Promise.all([
        startProgramEnrollment({
          userId,
          planId,
          presetRevision: PROGRAM_PRESET_REVISION,
          enrolledOn,
        }),
        new Promise((resolve) => setTimeout(resolve, PLAN_GENERATING_MS)),
      ]);

      // Null means this build could not resolve the plan's content, or the
      // backend has no enrollment tables. Neither is an error the card can
      // explain away, and neither leaves the user with a plan.
      if (enrollment == null) {
        throw new Error('This plan could not be started.');
      }

      return enrollment;
    },
    onSuccess: async (enrollment) => {
      const queryKey = getProgramEnrollmentQueryKey(userId);
      // The row we just wrote is the canonical shape this key holds, so it is
      // published rather than refetched — the plan screen redraws from it in
      // the same commit the button finishes in.
      await queryClient.cancelQueries({ queryKey, exact: true });
      queryClient.setQueryData(queryKey, enrollment);

      // Nothing is credited against day one yet, but the completions cache is
      // keyed by enrollment and day and may still hold a previous plan's list.
      await queryClient.invalidateQueries({
        queryKey: getProgramDayCompletionsQueryKeyPrefix(userId),
      });
    },
  });
}
