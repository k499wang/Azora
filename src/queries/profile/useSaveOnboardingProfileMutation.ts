import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  type CompleteOnboardingInput,
  saveOnboardingProfile,
} from '../../services/profile/onboardingStatusService';
import type { UserProfile } from '../../services/profile/profileService';
import type { ProfileSummary } from '../../services/profile/profileSummaryService';
import { getProfileQueryKey } from './useProfileQuery';
import { getProfileSummaryQueryKey } from './useProfileSummaryQuery';
import { getSavedOnboardingProfileQueryKey } from './useSavedOnboardingProfileQuery';
import { getUserDefaultTechniqueQueryKey } from './useUserDefaultTechniqueQuery';

const FALLBACK_TIMEZONE = 'America/Toronto';

export function useSaveOnboardingProfileMutation(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CompleteOnboardingInput) => {
      if (userId == null) {
        throw new Error('Cannot save onboarding profile without a signed-in user.');
      }

      const startedAt = Date.now();
      console.log('[onboarding-profile] save mutation started', {
        userId,
        hasGoal: input.onboardingGoal != null && input.onboardingGoal.length > 0,
        hasAge: input.age != null,
        hasGender: input.gender != null,
        hasDailyMinutes: input.dailyMinutes != null,
        hasDefaultTechnique: input.defaultTechniqueId != null,
      });

      try {
        await saveOnboardingProfile(userId, input);
        console.log('[onboarding-profile] save mutation succeeded', {
          userId,
          elapsedMs: Date.now() - startedAt,
        });
      } catch (error) {
        console.warn('[onboarding-profile] save mutation failed', {
          userId,
          elapsedMs: Date.now() - startedAt,
          errorMessage: getErrorMessage(error),
        });
        throw error;
      }

      return input;
    },
    onSuccess: async (input) => {
      queryClient.setQueryData(getSavedOnboardingProfileQueryKey(userId), input);

      queryClient.setQueryData(
        getUserDefaultTechniqueQueryKey(userId),
        input.defaultTechniqueId ?? null,
      );

      queryClient.setQueryData<UserProfile | null>(
        getProfileQueryKey(userId),
        (current) => {
          if (userId == null) return current ?? null;

          return {
            userId,
            displayName: input.displayName ?? null,
            avatarUrl: current?.avatarUrl ?? null,
            timezone: current?.timezone ?? FALLBACK_TIMEZONE,
            onboardingGoal: input.onboardingGoal ?? null,
            onboardingCompletedAt: current?.onboardingCompletedAt ?? null,
            age: input.age ?? null,
            gender: input.gender ?? null,
            dailyMinutes: input.dailyMinutes ?? null,
            defaultTechniqueId: input.defaultTechniqueId ?? null,
          };
        },
      );

      queryClient.setQueryData<ProfileSummary>(
        getProfileSummaryQueryKey(userId),
        (current) => ({
          profile: {
            displayName: input.displayName ?? null,
            avatarUrl: current?.profile?.avatarUrl ?? null,
            timezone: current?.profile?.timezone ?? FALLBACK_TIMEZONE,
          },
          longestHoldSeconds: current?.longestHoldSeconds ?? null,
          breathHoldCount: current?.breathHoldCount ?? 0,
          activeDays: current?.activeDays ?? 0,
          currentStreak: current?.currentStreak ?? 0,
          longestStreak: current?.longestStreak ?? 0,
          completedDays: current?.completedDays ?? [],
          completedDaysAgo: current?.completedDaysAgo ?? [],
          breathHoldTrend: current?.breathHoldTrend ?? [],
          partialErrors: current?.partialErrors ?? {
            profile: false,
            longestHold: false,
            breathHoldCount: false,
            activeDays: false,
            streak: false,
            completedDays: false,
            breathHoldTrend: false,
          },
        }),
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getUserDefaultTechniqueQueryKey(userId),
        }),
        queryClient.invalidateQueries({
          queryKey: getProfileQueryKey(userId),
        }),
        queryClient.invalidateQueries({
          queryKey: getProfileSummaryQueryKey(userId),
        }),
      ]);
    },
  });
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    error != null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return String(error);
}
