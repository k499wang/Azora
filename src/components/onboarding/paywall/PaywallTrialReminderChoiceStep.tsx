import { Text } from '../../common/Text';
import { Pressable, View } from 'react-native';
import { paywallStepStyles as styles } from './paywallStepStyles';
import { triggerTapHaptic } from '../../../native/tapHaptics';
import { PaywallChoiceCard } from '../../paywall/PaywallChoiceCard';
import { TrialReminderBell } from './TrialReminderBell';
import { availableTrialReminderDays, formatTrialDate, trialTimelineDates } from '../../../lib/paywall/trialReminder';
import type { PaywallTrialReminderState } from '../../../hooks/usePaywallTrialReminder';

export function PaywallTrialReminderChoiceStep({ trialDays, reminder, disabled = false }: {
  trialDays: number;
  reminder: PaywallTrialReminderState;
  disabled?: boolean;
}) {
  const choices = availableTrialReminderDays(trialDays);
  return (
    <View style={styles.heroContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>When should we remind you before your trial ends?</Text>
      </View>
      <View style={styles.bellWrap}><TrialReminderBell /></View>
      <View accessibilityRole="radiogroup" style={styles.reminderChoices}>
        {choices.map((days) => {
          const selected = reminder.enabled && reminder.daysBeforeEnd === days;
          const choiceDisabled = disabled || reminder.busy || reminder.unavailable;
          const date = formatTrialDate(trialTimelineDates(new Date(), trialDays, days).reminder);
          return (
            <PaywallChoiceCard
              key={days}
              title={`${days} days before`}
              detail={date}
              accessibilityRole="radio"
              accessibilityLabel={`${days} days before, ${date}`}
              selected={selected}
              showRadio={false}
              disabled={choiceDisabled}
              onPress={() => {
                triggerTapHaptic();
                void reminder.chooseDaysBeforeEnd(days);
              }}
            />
          );
        })}
      </View>
      {choices.length === 0 ? (
        <Text style={styles.reminderChoiceHint}>This trial is too short for a two-day reminder.</Text>
      ) : null}
      {reminder.error ? <Text accessibilityRole="alert" style={styles.reminderChoiceHint}>{reminder.error}</Text> : null}
      {reminder.denied ? (
        <Pressable accessibilityRole="link" onPress={reminder.openSettings}>
          <Text style={styles.reminderSettingsLink}>Notifications are off. Open Settings to enable them.</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default PaywallTrialReminderChoiceStep;
