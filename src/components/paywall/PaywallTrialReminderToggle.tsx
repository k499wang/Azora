import { Text } from '../common/Text';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { usePaywallTrialReminder, type PaywallTrialReminderState } from '../../hooks/usePaywallTrialReminder';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { card } from '../../theme/card';

interface PaywallTrialReminderToggleProps {
  dark?: boolean;
  disabled?: boolean;
  preview?: boolean;
}

export default function PaywallTrialReminderToggle({ dark = false, disabled = false, preview = false }: PaywallTrialReminderToggleProps) {
  const reminder = usePaywallTrialReminder(preview);
  return <PaywallTrialReminderControl dark={dark} disabled={disabled} reminder={reminder} />;
}

export function PaywallTrialReminderControl({ dark = false, disabled = false, reminder }: {
  dark?: boolean;
  disabled?: boolean;
  reminder: PaywallTrialReminderState;
}) {
  const reminderOn = reminder.enabled;
  const showDeniedHint = reminder.denied;
  return (
    <View style={styles.container}>
      <View style={[styles.row, dark && styles.rowDark, disabled && styles.rowDisabled]}>
        <Text style={[styles.label, dark && styles.labelDark, disabled && styles.labelDisabled]}>Notify me before trial ends</Text>
        <Switch
          value={disabled ? false : reminderOn}
          disabled={disabled || reminder.busy || reminder.unavailable}
          onValueChange={(value) => {
            void reminder.setEnabled(value);
          }}
          trackColor={{ false: dark ? colors.paywall.switchTrack : colors.neutral[300], true: colors.primary.blue300 }}
          thumbColor={reminderOn && !disabled ? colors.primary.blue400 : dark ? colors.neutral[200] : colors.neutral[50]}
          style={styles.switch}
        />
      </View>
      {reminder.error ? <Text accessibilityRole="alert" style={[styles.hintText, dark && styles.hintTextDark]}>{reminder.error}</Text> : null}
      {showDeniedHint ? (
        <Pressable
          accessibilityRole="link"
          onPress={() => {
            reminder.openSettings();
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
    backgroundColor: colors.paywall.toggleFill,
    borderColor: colors.paywall.toggleEdge,
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
