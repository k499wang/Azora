import { Text } from './Text';
import { useState, type ReactNode } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/card';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

interface TimePickerSheetOptions {
  /** 24-hour `HH:MM`. */
  value: string;
  onChange: (next: string) => void;
  title: string;
  disabled?: boolean;
}

interface TimePickerSheet {
  open: () => void;
  /** Render this next to the trigger; Android uses the system dialog instead. */
  sheet: ReactNode;
}

/**
 * Opens the platform's native time picker: the system dialog on Android, a
 * bottom sheet wrapping the wheel picker on iOS, where the picker has no
 * modal presentation of its own.
 */
export function useTimePickerSheet({
  value,
  onChange,
  title,
  disabled = false,
}: TimePickerSheetOptions): TimePickerSheet {
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(() => timeStringToDate(value));

  const open = () => {
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

    setDraft(timeStringToDate(value));
    setIsOpen(true);
  };

  const confirm = () => {
    onChange(dateToTimeString(draft));
    setIsOpen(false);
  };

  const sheet =
    Platform.OS === 'ios' ? (
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setIsOpen(false)}
          />
          <View
            style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}
          >
            <View style={styles.grabber} />
            <View style={styles.sheetHeader}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setIsOpen(false)}
                hitSlop={10}
                style={({ pressed }) => [pressed && styles.sheetActionPressed]}
              >
                <Text style={styles.sheetCancel}>Cancel</Text>
              </Pressable>
              <Text style={styles.sheetTitle}>{title}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={confirm}
                hitSlop={10}
                style={({ pressed }) => [pressed && styles.sheetActionPressed]}
              >
                <Text style={styles.sheetDone}>Done</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={draft}
              mode="time"
              display="spinner"
              themeVariant="light"
              onChange={(_event, date) => {
                if (date != null) setDraft(date);
              }}
              style={styles.picker}
            />
          </View>
        </View>
      </Modal>
    ) : null;

  return { open, sheet };
}

export function timeStringToDate(value: string): Date {
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

export function dateToTimeString(date: Date): string {
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${hour}:${minute}`;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.background.elevated,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  grabber: {
    width: 42,
    height: 5,
    borderRadius: radius.full,
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
