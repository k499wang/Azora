import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useNotificationPreferencesQuery } from '../queries/notifications/useNotificationPreferencesQuery';
import { useUpdateNotificationPreferencesMutation } from '../queries/notifications/useUpdateNotificationPreferencesMutation';
import { getNotificationPermissionStatus, requestNotificationPermissions } from '../services/notifications/notificationClient';
import { DEFAULT_NOTIFICATION_PREFERENCES, type NotificationPermissionStatus } from '../services/notifications/types';
import { trackNotificationPermissionResult } from '../services/analytics/tracking';
import { TRIAL_REMINDER_DAYS_BEFORE_END, type TrialReminderDaysBeforeEnd } from '../lib/paywall/trialReminder';

type ReminderChoice = { enabled: boolean; daysBeforeEnd: TrialReminderDaysBeforeEnd };

export interface PaywallTrialReminderState {
  enabled: boolean;
  daysBeforeEnd: TrialReminderDaysBeforeEnd;
  selectedDaysBeforeEnd: TrialReminderDaysBeforeEnd | null;
  busy: boolean;
  unavailable: boolean;
  denied: boolean;
  error: string | null;
  setEnabled: (enabled: boolean) => Promise<boolean>;
  chooseDaysBeforeEnd: (days: TrialReminderDaysBeforeEnd) => Promise<boolean>;
  openSettings: () => void;
}

/** One permission and preference owner shared by the reminder choice and final plan. */
export function usePaywallTrialReminder(preview = false): PaywallTrialReminderState {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const preferencesQuery = useNotificationPreferencesQuery(preview ? null : userId);
  const updatePreferences = useUpdateNotificationPreferencesMutation(preview ? null : userId);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>('undetermined');
  const [previewPreference, setPreviewPreference] = useState({ enabled: false, daysBeforeEnd: TRIAL_REMINDER_DAYS_BEFORE_END });
  const [requesting, setRequesting] = useState(false);
  const [pendingChoice, setPendingChoice] = useState<{ userId: string; days: TrialReminderDaysBeforeEnd | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestInFlight = useRef<{ userId: string; desired: ReminderChoice; promise: Promise<boolean> } | null>(null);
  const lifecycle = useRef(0);

  useEffect(() => {
    lifecycle.current += 1;
    requestInFlight.current = null;
    setRequesting(false);
    setPendingChoice(null);
    setError(null);
    return () => { lifecycle.current += 1; };
  }, [userId, preview]);

  useEffect(() => {
    if (preview) return;
    let cancelled = false;
    getNotificationPermissionStatus().then((status) => {
      if (!cancelled) setPermissionStatus(status);
    }).catch(() => {
      if (!cancelled) setPermissionStatus('undetermined');
    });
    return () => { cancelled = true; };
  }, [preview]);

  const preference = preview ? previewPreference : (preferencesQuery.data ?? DEFAULT_NOTIFICATION_PREFERENCES).trialEndingReminder;
  const daysBeforeEnd = preference.daysBeforeEnd ?? TRIAL_REMINDER_DAYS_BEFORE_END;
  const enabled = preference.enabled && (preview || permissionStatus === 'granted');
  const busy = !preview && (requesting || updatePreferences.isPending || preferencesQuery.isPending);
  const save = useCallback((enabled: boolean, days: TrialReminderDaysBeforeEnd): Promise<boolean> => {
    if (preview) {
      setPreviewPreference({ enabled, daysBeforeEnd: days });
      return Promise.resolve(true);
    }
    if (userId == null || preferencesQuery.isPending || preferencesQuery.isError) return Promise.resolve(false);
    const desired = { enabled, daysBeforeEnd: days };
    setPendingChoice({ userId, days: enabled ? days : null });
    setError(null);
    const activeRequest = requestInFlight.current;
    if (activeRequest?.userId === userId) {
      activeRequest.desired = desired;
      return activeRequest.promise;
    }
    const requestLifecycle = lifecycle.current;
    const isCurrent = () => lifecycle.current === requestLifecycle && useAuthStore.getState().user?.id === userId;
    setRequesting(true);
    const promise: Promise<boolean> = Promise.resolve().then(async (): Promise<boolean> => {
      try {
        let status: NotificationPermissionStatus | null = null;
        while (isCurrent()) {
          if (request.desired.enabled && status == null) {
            // Recheck each batch after Settings; share one permission result across rapid choices.
            status = await getNotificationPermissionStatus();
            if (!isCurrent()) return false;
            if (status === 'undetermined') {
              status = await requestNotificationPermissions();
              if (!isCurrent()) return false;
              trackNotificationPermissionResult({ status, source: 'paywall' });
            }
            setPermissionStatus(status);
          }
          const choice = request.desired;
          const isLatest = () => request.desired.enabled === choice.enabled
            && request.desired.daysBeforeEnd === choice.daysBeforeEnd;
          try {
            await updatePreferences.mutateAsync({
              trialEndingReminder: { enabled: choice.enabled && status === 'granted', daysBeforeEnd: choice.daysBeforeEnd },
            });
          } catch {
            if (!isCurrent()) return false;
            if (!isLatest()) continue;
            throw new Error('Could not save reminder');
          }
          if (!isCurrent()) return false;
          if (isLatest()) return !choice.enabled || status === 'granted';
        }
        return false;
      } catch {
        if (isCurrent()) setError('Couldn’t update your reminder. Please try again.');
        return false;
      } finally {
        if (isCurrent()) {
          requestInFlight.current = null;
          setRequesting(false);
          setPendingChoice(null);
        }
      }
    });
    const request = { userId, desired, promise };
    requestInFlight.current = request;
    return promise;
  }, [preferencesQuery.isError, preferencesQuery.isPending, preview, updatePreferences, userId]);

  return {
    enabled,
    daysBeforeEnd,
    selectedDaysBeforeEnd: pendingChoice?.userId === userId ? pendingChoice.days : enabled ? daysBeforeEnd : null,
    busy,
    unavailable: !preview && (userId == null || preferencesQuery.isPending || preferencesQuery.isError),
    denied: !preview && permissionStatus === 'denied',
    error: error ?? (!preview && preferencesQuery.isError ? 'Couldn’t load your reminder. Please try again.' : null),
    setEnabled: (enabled) => save(enabled, requestInFlight.current?.userId === userId
      ? requestInFlight.current.desired.daysBeforeEnd : daysBeforeEnd),
    chooseDaysBeforeEnd: (days) => save(true, days),
    openSettings: () => {
      void Linking.openSettings().catch(() => setError('Couldn’t open Settings. Please try again.'));
    },
  };
}
