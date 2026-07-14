import { Text } from '../common/Text';
import { useCallback, useEffect, useState } from 'react';
import {
  Linking, Pressable, StyleSheet, Switch, View } from 'react-native';
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

interface PaywallTrialReminderToggleProps {
  dark?: boolean;
  disabled?: boolean;
}

export default function PaywallTrialReminderToggle({ dark = false, disabled = false }: PaywallTrialReminderToggleProps) {
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

  const reminderOn = enabled && permissionStatus !== 'denied';
  const showDeniedHint = permissionStatus === 'denied';

  return (
    <View style={styles.container}>
      <View style={[styles.row, dark && styles.rowDark, disabled && styles.rowDisabled]}>
        <Text style={[styles.label, dark && styles.labelDark, disabled && styles.labelDisabled]}>Notify me before trial ends</Text>
        <Switch
          value={disabled ? false : reminderOn}
          disabled={disabled || isBusy || userId == null}
          onValueChange={(value) => {
            void handleToggle(value);
          }}
          trackColor={{ false: dark ? 'rgba(255,255,255,0.2)' : colors.neutral[300], true: colors.primary.blue300 }}
          thumbColor={reminderOn && !disabled ? colors.primary.blue400 : dark ? colors.neutral[200] : colors.neutral[50]}
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
          <Text style={[styles.hintText, dark && styles.hintTextDark]}>
            Notifications are off in system settings.
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
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  rowDark: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.12)',
    shadowOpacity: 0,
    elevation: 0,
  },
  rowDisabled: {
    opacity: 0.45,
  },
  labelDisabled: {
    opacity: 0.9,
  },
  label: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
    flex: 1,
  },
  labelDark: {
    color: colors.neutral[0],
  },
  switch: {
    transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
  },
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
  hintTextDark: {
    color: colors.warning[500],
  },
});
