import { useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import type { BreathHoldCompletion } from '../domain/breathHoldCompletion';
import { useCompleteBreathHoldMutation } from '../../../../queries/tracking/useCompleteBreathHoldMutation';
import { captureException } from '../../../../services/analytics/errorTracking';

export function useBreathHoldCompletionPersistence(
  userId: string | null,
  inhaleSeconds: number,
) {
  const savedSessionKeyRef = useRef<string | null>(null);
  const savingSessionKeyRef = useRef<string | null>(null);
  const completeBreathHoldMutation = useCompleteBreathHoldMutation(userId);

  const reset = useCallback(() => {
    savedSessionKeyRef.current = null;
    savingSessionKeyRef.current = null;
  }, []);

  const save = useCallback(
    async (completion: BreathHoldCompletion) => {
      const { sessionKey, startedAtMs } = completion;
      if (sessionKey == null || startedAtMs == null) return;
      if (
        savedSessionKeyRef.current === sessionKey ||
        savingSessionKeyRef.current === sessionKey
      ) {
        return;
      }

      savingSessionKeyRef.current = sessionKey;
      try {
        await completeBreathHoldMutation.mutateAsync({
          startedAt: new Date(startedAtMs).toISOString(),
          endedAt: new Date(completion.endedAtMs).toISOString(),
          inhaleSeconds,
          holdSeconds: completion.holdSeconds,
          avgBpm: completion.avgBpm,
          minBpm: completion.minBpm,
          maxBpm: completion.maxBpm,
          azoraScore: completion.azoraScore,
          samples: completion.persistenceSamples,
        });
        savedSessionKeyRef.current = sessionKey;
      } catch (error) {
        const details = error as {
          name?: string;
          message?: string;
          stack?: string;
          code?: string;
          details?: string;
          hint?: string;
          status?: number;
          cause?: unknown;
        } | null;
        console.error('[daily-breath-hold] Could not save breath hold', {
          errorName: details?.name,
          errorMessage: details?.message,
          errorCode: details?.code,
          errorDetails: details?.details,
          errorHint: details?.hint,
          errorStatus: details?.status,
          errorCause: details?.cause,
          errorStack: details?.stack,
          error,
          sessionKey,
          startedAtMs,
          endedAtMs: completion.endedAtMs,
          holdSeconds: completion.holdSeconds,
          bpmSampleCount: completion.graphSamples.length,
          hasReading: completion.hasReading,
        });
        captureException(error, {
          flow: 'daily_breath_hold',
          action: 'complete_breath_hold',
          screen_name: 'DailyExercise',
        });
        Alert.alert(
          'Could not save breath hold',
          'Please check your connection and try again.',
        );
      } finally {
        if (savingSessionKeyRef.current === sessionKey) {
          savingSessionKeyRef.current = null;
        }
      }
    },
    [completeBreathHoldMutation, inhaleSeconds],
  );

  return { reset, save };
}
