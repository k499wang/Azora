import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useNotificationPreferencesQuery } from '../queries/notifications/useNotificationPreferencesQuery';
import { useUpdateNotificationPreferencesMutation } from '../queries/notifications/useUpdateNotificationPreferencesMutation';
import { getNotificationPermissionStatus, requestNotificationPermissions } from '../services/notifications/notificationClient';
import { DEFAULT_NOTIFICATION_PREFERENCES, type NotificationPermissionStatus } from '../services/notifications/types';
import { trackNotificationPermissionResult } from '../services/analytics/tracking';
import { TRIAL_REMINDER_DAYS_BEFORE_END, type TrialReminderDaysBeforeEnd } from '../lib/paywall/trialReminder';

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
  const requestInFlight = useRef(false);
  const lifecycle = useRef(0);

  useEffect(() => {
    lifecycle.current += 1;
    requestInFlight.current = false;
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
  const save = useCallback(async (enabled: boolean, days: TrialReminderDaysBeforeEnd) => {
    if (preview) {
      setPreviewPreference({ enabled, daysBeforeEnd: days });
      return true;
    }
    if (userId == null || busy || requestInFlight.current) return false;
    const requestLifecycle = lifecycle.current;
    const isCurrent = () => lifecycle.current === requestLifecycle && useAuthStore.getState().user?.id === userId;
    requestInFlight.current = true;
    setPendingChoice({ userId, days: enabled ? days : null });
    setRequesting(true);
    setError(null);
    try {
      let status = permissionStatus;
      if (enabled) {
        // Recheck after returning from system Settings as well as before first consent.
        status = await getNotificationPermissionStatus();
        if (!isCurrent()) return false;
        if (status === 'undetermined') {
          status = await requestNotificationPermissions();
          if (!isCurrent()) return false;
          trackNotificationPermissionResult({ status, source: 'paywall' });
        }
        setPermissionStatus(status);
      }
      if (!isCurrent()) return false;
      await updatePreferences.mutateAsync({
        trialEndingReminder: { enabled: enabled && status === 'granted', daysBeforeEnd: days },
      });
      return isCurrent() && (!enabled || status === 'granted');
    } catch {
      if (isCurrent()) setError('Couldn’t update your reminder. Please try again.');
      return false;
    } finally {
      if (isCurrent()) {
        requestInFlight.current = false;
        setRequesting(false);
        setPendingChoice(null);
      }
    }
  }, [busy, permissionStatus, preview, updatePreferences, userId]);

  return {
    enabled,
    daysBeforeEnd,
    selectedDaysBeforeEnd: pendingChoice?.userId === userId ? pendingChoice.days : enabled ? daysBeforeEnd : null,
    busy,
    unavailable: !preview && (userId == null || preferencesQuery.isPending || preferencesQuery.isError),
    denied: !preview && permissionStatus === 'denied',
    error: error ?? (!preview && preferencesQuery.isError ? 'Couldn’t load your reminder. Please try again.' : null),
    setEnabled: (enabled) => save(enabled, daysBeforeEnd),
    chooseDaysBeforeEnd: (days) => save(true, days),
    openSettings: () => {
      void Linking.openSettings().catch(() => setError('Couldn’t open Settings. Please try again.'));
    },
  };
}
