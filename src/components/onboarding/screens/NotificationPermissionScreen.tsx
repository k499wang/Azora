import { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { card } from '../../../theme/card';
import type { NotificationPreferences } from '../../../services/notifications/types';

interface NotificationPermissionScreenProps {
  stepIndex: number;
  stepCount: number;
  isSubmitting: boolean;
  errorMessage: string | null;
  onEnable: (preferences: NotificationPreferences) => void;
  onSkip: () => void;
  onBack: () => void;
}

export default function NotificationPermissionScreen({
  stepIndex,
  stepCount,
  isSubmitting,
  errorMessage,
  onEnable,
  onSkip,
  onBack,
}: NotificationPermissionScreenProps) {
  const [enabled, setEnabled] = useState(true);
  const [time, setTime] = useState('08:00');

  const preferences = useMemo<NotificationPreferences>(
    () => ({
      dailyReminder: { enabled, time },
      trialEndingReminder: { enabled: true },
    }),
    [enabled, time],
  );

  return (
    <OnboardingScreenLayout
      title="Make it stick"
      subtitle="A daily cue is the biggest reason people keep going. Pick a time and we'll send one gentle reminder. Nothing else."
      progress={stepIndex / stepCount}
      onBack={onBack}
      onSkip={onSkip}
      footer={
        <OnboardingPrimaryButton
          label="Enable reminder"
          loading={isSubmitting}
          onPress={() => onEnable(preferences)}
        />
      }
    >
      <View style={styles.content}>
        <ReminderCard
          enabled={enabled}
          time={time}
          onToggle={setEnabled}
          onTimeChange={setTime}
        />

        <Text style={styles.reassurance}>
          You're in control. Change the time or turn it off anytime in Settings.
        </Text>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </View>
    </OnboardingScreenLayout>
  );
}


function formatDisplay(time: string): string {
  const [hourRaw, minute] = time.split(':');
  const hour = Number(hourRaw);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:${minute} ${suffix}`;
}

function timeStringToDate(value: string): Date {
  const [hourRaw, minuteRaw] = value.split(':');
  const date = new Date();
  date.setHours(
    Number.isFinite(Number(hourRaw)) ? Number(hourRaw) : 8,
    Number.isFinite(Number(minuteRaw)) ? Number(minuteRaw) : 0,
    0,
    0,
  );
  return date;
}

function dateToTimeString(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function ReminderCard({
  enabled,
  time,
  onToggle,
  onTimeChange,
}: {
  enabled: boolean;
  time: string;
  onToggle: (enabled: boolean) => void;
  onTimeChange: (time: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [iosOpen, setIosOpen] = useState(false);
  const [iosDraft, setIosDraft] = useState<Date>(() => timeStringToDate(time));

  const openPicker = () => {
    if (!enabled) return;
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: timeStringToDate(time),
        mode: 'time',
        is24Hour: false,
        onChange: (event: DateTimePickerEvent, date?: Date) => {
          if (event.type !== 'set' || date == null) return;
          onTimeChange(dateToTimeString(date));
        },
      });
      return;
    }
    setIosDraft(timeStringToDate(time));
    setIosOpen(true);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Daily reminder at ${formatDisplay(time)}, tap to change`}
        onPress={openPicker}
        style={({ pressed }) => [
          styles.card,
          pressed && enabled && styles.cardPressed,
        ]}
      >
        <View style={styles.cardLeft}>
          <Text style={[styles.cardLabel, !enabled && styles.cardLabelDisabled]}>
            Daily reminder
          </Text>
          <View style={styles.timeRow}>
            <Text style={[styles.cardTime, !enabled && styles.cardTimeDisabled]}>
              {formatDisplay(time)}
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color={enabled ? colors.text.secondary : colors.text.tertiary}
            />
          </View>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: colors.neutral[300], true: colors.primary.blue300 }}
          thumbColor={colors.background.elevated}
        />
      </Pressable>

      {Platform.OS === 'ios' ? (
        <Modal
          visible={iosOpen}
          animationType="slide"
          transparent
          statusBarTranslucent
          onRequestClose={() => setIosOpen(false)}
        >
          <View style={styles.backdrop}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setIosOpen(false)} />
            <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
              <View style={styles.grabber} />
              <View style={styles.sheetHeader}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setIosOpen(false)}
                  hitSlop={10}
                  style={({ pressed }) => [pressed && styles.sheetActionPressed]}
                >
                  <Text style={styles.sheetCancel}>Cancel</Text>
                </Pressable>
                <Text style={styles.sheetTitle}>Set reminder time</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    onTimeChange(dateToTimeString(iosDraft));
                    setIosOpen(false);
                  }}
                  hitSlop={10}
                  style={({ pressed }) => [pressed && styles.sheetActionPressed]}
                >
                  <Text style={styles.sheetDone}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={iosDraft}
                mode="time"
                display="spinner"
                themeVariant="light"
                onChange={(_event, date) => {
                  if (date != null) setIosDraft(date);
                }}
                style={styles.picker}
              />
            </View>
          </View>
        </Modal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  card: {
    ...card.base,
    ...card.shadow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: 22,
  },
  cardPressed: {
    opacity: 0.75,
  },
  cardLeft: {
    gap: 2,
  },
  cardLabel: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  cardLabelDisabled: {
    color: colors.text.tertiary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  cardTime: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
  },
  cardTimeDisabled: {
    color: colors.text.tertiary,
  },

  reassurance: {
    ...typography.body.small,
    color: colors.text.tertiary,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  errorText: {
    ...typography.body.small,
    color: colors.error[500],
    textAlign: 'center',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.background.primary,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  grabber: {
    width: 42,
    height: 5,
    borderRadius: 999,
    alignSelf: 'center',
    backgroundColor: colors.neutral[300],
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
  },
  sheetCancel: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
  sheetDone: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.primary.blue600,
  },
  sheetActionPressed: {
    opacity: 0.6,
  },
  picker: {
    alignSelf: 'stretch',
  },
});
