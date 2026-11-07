import { Text } from '../../common/Text';
import { Pressable, View } from 'react-native';
import { paywallStepStyles as styles } from './paywallStepStyles';
import { triggerTapHaptic } from '../../../native/tapHaptics';
import { PaywallChoiceCard } from '../../paywall/PaywallChoiceCard';
import { TrialReminderBell } from './TrialReminderBell';
import { availableTrialReminderDays, formatTrialDate, trialTimelineDates } from '../../../lib/paywall/trialReminder';
import type { PaywallTrialReminderState } from '../../../hooks/usePaywallTrialReminder';

export function PaywallTrialReminderChoiceStep({ trialDays, choiceTrialDays = trialDays, longestPlanTitle, reminder, disabled = false, paidTrial = false }: {
  trialDays: number;
  /** The longest trial on offer, which sets the choices; `trialDays` dates them. */
  choiceTrialDays?: number;
  longestPlanTitle?: string;
  reminder: PaywallTrialReminderState;
  disabled?: boolean;
  /** A paid trial always offers the choice, even with one possible day. */
  paidTrial?: boolean;
}) {
  const choices = availableTrialReminderDays(choiceTrialDays);
  const fitsSelectedPlan = availableTrialReminderDays(trialDays);
  // A free trial with one possible day has nothing to ask; Continue sets it up.
  const onlyDays = !paidTrial && choices.length === 1 ? choices[0] : null;
  const title = onlyDays == null
    ? 'When should we remind you before your trial ends?'
    : reminder.denied
      ? `Turn on notifications and we’ll remind you ${onlyDays} days before your trial ends`
      : `We’ll remind you ${onlyDays} days before your trial ends`;
  return (
    <View style={styles.heroContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>{title}</Text>
      </View>
      <View style={styles.bellWrap}><TrialReminderBell /></View>
      {onlyDays == null ? <View accessibilityRole="radiogroup" style={styles.reminderChoices}>
        {choices.map((days) => {
          const selected = reminder.selectedDaysBeforeEnd === days;
          const choiceDisabled = disabled || reminder.unavailable;
          const date = fitsSelectedPlan.includes(days)
            ? formatTrialDate(trialTimelineDates(new Date(), trialDays, days).reminder)
            : `${longestPlanTitle} plan only`;
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
      </View> : null}
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
