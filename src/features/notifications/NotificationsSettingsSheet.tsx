import { Text } from '../../components/common/Text';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Animated, Easing, Linking, Modal, Pressable, StyleSheet, Switch, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type DailyReminderPreference,
} from '../../services/notifications/types';
import {
  getNotificationPermissionStatus,
  requestNotificationPermissions,
} from '../../services/notifications/notificationClient';
import { useNotificationPreferencesQuery } from '../../queries/notifications/useNotificationPreferencesQuery';
import { useUpdateNotificationPreferencesMutation } from '../../queries/notifications/useUpdateNotificationPreferencesMutation';
import TimePickerField from '../../components/common/TimePickerField';
import { trackNotificationPermissionResult } from '../../services/analytics/tracking';

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
  const insets = useSafeAreaInsets();
  const preferencesQuery = useNotificationPreferencesQuery(userId);
  const updatePreferences = useUpdateNotificationPreferencesMutation(userId);
  const [permissionStatus, setPermissionStatus] = useState<string>('undetermined');
  const progress = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  const preferences = preferencesQuery.data ?? DEFAULT_NOTIFICATION_PREFERENCES;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(progress, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else if (mounted) {
      Animated.timing(progress, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, mounted, progress]);

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

  const hasEnabledNotification = preferences.dailyReminder.enabled;

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

  const updateReminder = async (next: Partial<DailyReminderPreference>) => {
    if (userId == null) return;

    if (next.enabled === true) {
      const permissionGranted = await ensurePermissionForEnabledNotification();
      if (!permissionGranted) return;
    }

    await updatePreferences.mutateAsync({ dailyReminder: next });
  };

  if (!mounted) return null;

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  return (
    <Modal
      visible={mounted}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Animated.View style={[styles.backdropFill, { opacity: progress }]} />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + spacing.lg, transform: [{ translateY }] },
          ]}
        >
          <View style={styles.grabber} />
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Notifications</Text>
              <Text style={styles.subtitle}>
                A daily nudge so your practice does not slip.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close notifications settings"
              onPress={onClose}
              hitSlop={10}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed,
              ]}
            >
              <MaterialCommunityIcons name="close" size={22} color={colors.text.secondary} />
            </Pressable>
          </View>

          {preferencesQuery.isPending ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.primary.blue600} />
            </View>
          ) : (
            <View style={styles.body}>
              <ReminderRow
                reminder={preferences.dailyReminder}
                disabled={updatePreferences.isPending}
                onUpdate={updateReminder}
              />

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
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

function ReminderRow({
  reminder,
  disabled,
  onUpdate,
}: {
  reminder: DailyReminderPreference;
  disabled: boolean;
  onUpdate: (next: Partial<DailyReminderPreference>) => Promise<void>;
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
          <Text style={styles.rowTitle}>Daily reminder</Text>
          <Text style={styles.rowSubtitle}>
            One nudge a day at the time you choose.
          </Text>
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
        value={reminder.time}
        onChange={(next) => {
          void onUpdate({ time: next });
        }}
        disabled={!reminder.enabled || disabled}
        accessibilityLabel="Daily reminder time"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay.dark,
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.background.primary,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  grabber: {
    width: 42,
    height: 5,
    borderRadius: 999,
    alignSelf: 'center',
    backgroundColor: colors.neutral[300],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.elevated,
  },
  closeButtonPressed: {
    opacity: 0.65,
  },
  loading: {
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    gap: spacing.md,
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
