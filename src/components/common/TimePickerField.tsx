import { Text } from './Text';
import { useMemo, useState } from 'react';
import {
  Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

interface TimePickerFieldProps {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export default function TimePickerField({
  value,
  onChange,
  disabled = false,
  accessibilityLabel,
}: TimePickerFieldProps) {
  const insets = useSafeAreaInsets();
  const [iosOpen, setIosOpen] = useState(false);
  const [iosDraft, setIosDraft] = useState<Date>(() => timeStringToDate(value));

  const displayLabel = useMemo(() => formatTime(value), [value]);

  const openPicker = () => {
    if (disabled) return;

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: timeStringToDate(value),
        mode: 'time',
        is24Hour: false,
        onChange: (event: DateTimePickerEvent, date?: Date) => {
          if (event.type !== 'set' || date == null) return;
          onChange(dateToTimeString(date));
        },
      });
      return;
    }

    setIosDraft(timeStringToDate(value));
    setIosOpen(true);
  };

  const confirmIos = () => {
    onChange(dateToTimeString(iosDraft));
    setIosOpen(false);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? `Change time, currently ${displayLabel}`}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={openPicker}
        style={({ pressed }) => [
          styles.pill,
          disabled && styles.pillDisabled,
          pressed && !disabled && styles.pillPressed,
        ]}
      >
        <Text style={styles.pillText}>{displayLabel}</Text>
        <MaterialCommunityIcons
          name="chevron-down"
          size={18}
          color={disabled ? colors.text.tertiary : colors.primary.blue700}
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
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setIosOpen(false)}
            />
            <View
              style={[
                styles.sheet,
                { paddingBottom: insets.bottom + spacing.lg },
              ]}
            >
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
                  onPress={confirmIos}
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

function timeStringToDate(value: string): Date {
  const [hourRaw, minuteRaw] = value.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  const date = new Date();
  date.setHours(
    Number.isFinite(hour) ? hour : 8,
    Number.isFinite(minute) ? minute : 0,
    0,
    0,
  );
  return date;
}

function dateToTimeString(date: Date): string {
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${hour}:${minute}`;
}

function formatTime(value: string): string {
  const [hourRaw, minute] = value.split(':');
  const hour = Number(hourRaw);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute} ${suffix}`;
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 40,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primary.blue600,
    backgroundColor: colors.primary.blue100,
  },
  pillPressed: {
    opacity: 0.72,
  },
  pillDisabled: {
    borderColor: colors.border.default,
    backgroundColor: colors.background.elevated,
  },
  pillText: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.primary.blue700,
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
