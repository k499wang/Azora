import { useCallback, useEffect, useState } from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationPreferencesQuery } from '../../queries/notifications/useNotificationPreferencesQuery';
import { useUpdateNotificationPreferencesMutation } from '../../queries/notifications/useUpdateNotificationPreferencesMutation';
import {
  getNotificationPermissionStatus,
  requestNotificationPermissions,
} from '../../services/notifications/notificationClient';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../../services/notifications/types';
import { trackNotificationPermissionResult } from '../../services/analytics/tracking';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { card } from '../../theme/card';
import type { NotificationPermissionStatus } from '../../services/notifications/types';

export default function PaywallTrialReminderToggle() {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const preferencesQuery = useNotificationPreferencesQuery(userId);
  const updatePreferences = useUpdateNotificationPreferencesMutation(userId);

  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermissionStatus>('undetermined');

  useEffect(() => {
    let cancelled = false;
    getNotificationPermissionStatus()
      .then((status) => {
        if (!cancelled) setPermissionStatus(status);
      })
      .catch(() => {
        if (!cancelled) setPermissionStatus('undetermined');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const preferences = preferencesQuery.data ?? DEFAULT_NOTIFICATION_PREFERENCES;
  const enabled = preferences.trialEndingReminder.enabled;
  const isBusy = updatePreferences.isPending || preferencesQuery.isPending;

  const handleToggle = useCallback(
    async (next: boolean) => {
      if (userId == null || isBusy) return;

      if (next) {
        let status = permissionStatus;
        if (status !== 'granted') {
          status = await requestNotificationPermissions();
          setPermissionStatus(status);
          trackNotificationPermissionResult({ status, source: 'paywall' });
        }
        if (status !== 'granted') {
          await updatePreferences.mutateAsync({
            trialEndingReminder: { enabled: false },
          });
          return;
        }
      }

      await updatePreferences.mutateAsync({
        trialEndingReminder: { enabled: next },
      });
    },
    [isBusy, permissionStatus, updatePreferences, userId],
  );

  const showDeniedHint = permissionStatus === 'denied' && !enabled;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Notify me before trial ends</Text>
        <Switch
          value={enabled}
          disabled={isBusy || userId == null}
          onValueChange={(value) => {
            void handleToggle(value);
          }}
          trackColor={{ false: colors.neutral[300], true: colors.primary.blue300 }}
          thumbColor={enabled ? colors.primary.blue600 : colors.neutral[50]}
          style={styles.switch}
        />
      </View>
      {showDeniedHint ? (
        <Pressable
          accessibilityRole="link"
          onPress={() => {
            void Linking.openSettings();
          }}
          style={({ pressed }) => [styles.hint, pressed && styles.hintPressed]}
        >
          <Text style={styles.hintText}>
            Notifications are off in system settings. Tap to enable.
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  row: {
    ...card.base,
    ...card.shadow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  label: {
    ...typography.heading.heading2,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  switch: {},
  hint: {
    paddingHorizontal: spacing.sm,
  },
  hintPressed: {
    opacity: 0.65,
  },
  hintText: {
    ...typography.caption.caption2,
    color: colors.warning[700],
    textAlign: 'center',
  },
});
