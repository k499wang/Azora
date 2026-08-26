import { Text } from '../../components/common/Text';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BottomSheet from '../../components/common/BottomSheet';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import {
  type DailyPlanReminderActionId,
  type NotificationPreferences,
} from '../../services/notifications/types';
import {
  getNotificationPermissionStatus,
  requestNotificationPermissions,
} from '../../services/notifications/notificationClient';
import { useNotificationPreferencesQuery } from '../../queries/notifications/useNotificationPreferencesQuery';
import { useUpdateNotificationPreferencesMutation } from '../../queries/notifications/useUpdateNotificationPreferencesMutation';
import { useDailyPlanScheduleQuery } from '../../queries/dailyPlan/useDailyPlanScheduleQuery';
import { useUpdateDailyPlanScheduleMutation } from '../../queries/dailyPlan/useUpdateDailyPlanScheduleMutation';
import type { DailyPlanActionId } from '../../services/dailyPlan/dailyPlanScheduleCore';
import TimePickerField from '../../components/common/TimePickerField';
import { trackNotificationPermissionResult } from '../../services/analytics/tracking';
import { DAILY_REMINDER_DEFINITIONS } from '../../services/notifications/notificationCatalog';

interface NotificationsSettingsSheetProps {
  visible: boolean;
  userId: string | null;
  onClose: () => void;
}

export default function NotificationsSettingsSheet({
  visible,
  userId,
  onClose,
}: NotificationsSettingsSheetProps) {
  const preferencesQuery = useNotificationPreferencesQuery(userId);
  const updatePreferences = useUpdateNotificationPreferencesMutation(userId);
  const scheduleQuery = useDailyPlanScheduleQuery(userId);
  const updateSchedule = useUpdateDailyPlanScheduleMutation(userId);
  const [permissionStatus, setPermissionStatus] = useState<string>('undetermined');

  const preferences = preferencesQuery.data;
  const schedule = scheduleQuery.data;
  const isInitialLoadPending =
    preferencesQuery.data == null || scheduleQuery.data == null;
  const hasInitialLoadError =
    isInitialLoadPending &&
    (preferencesQuery.isError || scheduleQuery.isError);

  useEffect(() => {
    if (!visible) return;
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
  }, [visible]);

  const hasEnabledNotification =
    preferences != null &&
    Object.values(preferences.dailyPlanReminders).some(
      (reminder) => reminder.enabled,
    );

  const ensurePermissionForEnabledNotification = async (): Promise<boolean> => {
    if (permissionStatus === 'granted') return true;

    const status = await requestNotificationPermissions();
    setPermissionStatus(status);
    trackNotificationPermissionResult({ status, source: 'settings' });

    if (status === 'granted') return true;

    Alert.alert(
      'Notifications are off',
      'Turn on notifications in Settings to receive reminders.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            void Linking.openSettings();
          },
        },
      ],
    );
    return false;
  };

  const updateReminder = async (
    actionId: DailyPlanReminderActionId,
    next: Partial<NotificationPreferences['dailyPlanReminders'][DailyPlanReminderActionId]>,
  ) => {
    if (userId == null) return;

    if (next.enabled === true) {
      const permissionGranted = await ensurePermissionForEnabledNotification();
      if (!permissionGranted) return;
    }

    await updatePreferences.mutateAsync({
      dailyPlanReminders: { [actionId]: next },
    });
  };

  const updateReminderTime = async (
    actionId: DailyPlanActionId,
    time: string,
  ) => {
    if (scheduleQuery.data == null) return;

    await updateSchedule.mutateAsync({
      ...scheduleQuery.data,
      actions: {
        ...scheduleQuery.data.actions,
        [actionId]: time,
      },
    });
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Notifications"
      subtitle="Choose when Azora reminds you about each daily reset."
    >
      {preferences == null || schedule == null ? (
        hasInitialLoadError ? (
          <View style={styles.loadError} accessibilityRole="alert">
            <MaterialCommunityIcons
              name="cloud-alert-outline"
              size={28}
              color={colors.error[500]}
            />
            <Text style={styles.loadErrorTitle}>
              Couldn&apos;t load notification settings
            </Text>
            <Text style={styles.loadErrorMessage}>
              Check your connection and try again. Your saved reminder
              times have not been changed.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void Promise.all([
                  preferencesQuery.refetch(),
                  scheduleQuery.refetch(),
                ]);
              }}
              disabled={
                preferencesQuery.isFetching || scheduleQuery.isFetching
              }
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.retryButtonPressed,
              ]}
            >
              {preferencesQuery.isFetching || scheduleQuery.isFetching ? (
                <ActivityIndicator
                  size="small"
                  color={colors.background.primary}
                />
              ) : (
                <Text style={styles.retryButtonText}>Try again</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary.blue600} />
          </View>
        )
      ) : (
        <ScrollView
          style={styles.bodyScroll}
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
        >
          {DAILY_REMINDER_DEFINITIONS.map((definition) => (
            <ReminderRow
              key={definition.id}
              title={definition.settings.title}
              subtitle={definition.settings.subtitle}
              reminder={preferences.dailyPlanReminders[definition.id]}
              time={schedule.actions[definition.scheduleActionId]}
              disabled={updatePreferences.isPending || updateSchedule.isPending}
              onUpdate={(next) => updateReminder(definition.id, next)}
              onTimeChange={(time) =>
                updateReminderTime(definition.scheduleActionId, time)
              }
            />
          ))}

          {permissionStatus === 'denied' && hasEnabledNotification ? (
            <Pressable
              onPress={() => {
                void Linking.openSettings();
              }}
              style={({ pressed }) => [
                styles.settingsNotice,
                pressed && styles.settingsNoticePressed,
              ]}
            >
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={18}
                color={colors.warning[700]}
              />
              <Text style={styles.settingsNoticeText}>
                Notifications are disabled in system settings.
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>
      )}
    </BottomSheet>
  );
}

function ReminderRow({
  title,
  subtitle,
  reminder,
  time,
  disabled,
  onUpdate,
  onTimeChange,
}: {
  title: string;
  subtitle: string;
  reminder: { enabled: boolean };
  time: string;
  disabled: boolean;
  onUpdate: (next: { enabled?: boolean }) => Promise<void>;
  onTimeChange: (time: string) => Promise<void>;
}) {
  return (
    <View style={styles.reminderBlock}>
      <View style={styles.rowTop}>
        <MaterialCommunityIcons
          name="bell-outline"
          size={21}
          color={colors.primary.blue600}
        />
        <View style={styles.rowCopy}>
          <Text style={styles.rowTitle}>{title}</Text>
          <Text style={styles.rowSubtitle}>{subtitle}</Text>
        </View>
        <Switch
          value={reminder.enabled}
          disabled={disabled}
          onValueChange={(enabled) => {
            void onUpdate({ enabled });
          }}
          trackColor={{ false: colors.neutral[300], true: colors.primary.blue300 }}
          thumbColor={reminder.enabled ? colors.primary.blue600 : colors.neutral[50]}
        />
      </View>
      <TimePickerField
        value={time}
        onChange={(next) => {
          void onTimeChange(next);
        }}
        disabled={!reminder.enabled || disabled}
        accessibilityLabel={`${title} reminder time`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadError: {
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  loadErrorTitle: {
    ...typography.body.large,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
    textAlign: 'center',
  },
  loadErrorMessage: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  retryButton: {
    minWidth: 120,
    minHeight: 44,
    marginTop: spacing.sm,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.blue600,
    paddingHorizontal: spacing.lg,
  },
  retryButtonPressed: {
    opacity: 0.75,
  },
  retryButtonText: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.background.primary,
  },
  body: {
    gap: spacing.md,
  },
  bodyScroll: {
    flexGrow: 0,
  },
  reminderBlock: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.elevated,
    padding: spacing.md,
    gap: spacing.md,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowCopy: {
    flex: 1,
  },
  rowTitle: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
  },
  rowSubtitle: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  settingsNotice: {
    minHeight: 44,
    borderRadius: 16,
    backgroundColor: colors.warning[100],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  settingsNoticePressed: {
    opacity: 0.75,
  },
  settingsNoticeText: {
    ...typography.body.small,
    flex: 1,
    color: colors.warning[700],
  },
});
