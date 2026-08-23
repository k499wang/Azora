import { StyleSheet, Switch, View } from 'react-native';
import { Text } from '../../common/Text';
import type { DailyPlanSchedule } from '../../../services/dailyPlan/types';
import { formatDailyPlanTime } from '../../../services/dailyPlan/dailyPlanScheduleCore';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { card } from '../../../theme/card';
import { DAILY_REMINDER_DEFINITIONS } from '../../../services/notifications/notificationCatalog';
import type {
  DailyPlanReminderActionId,
  DailyPlanReminderPreferences,
} from '../../../services/notifications/types';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingScreenLayout from '../OnboardingScreenLayout';

interface NotificationPermissionScreenProps {
  schedule: DailyPlanSchedule;
  reminders: DailyPlanReminderPreferences;
  stepIndex: number;
  stepCount: number;
  isSubmitting: boolean;
  errorMessage: string | null;
  onReminderEnabledChange: (
    actionId: DailyPlanReminderActionId,
    enabled: boolean,
  ) => void;
  onEnable: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export default function NotificationPermissionScreen({
  schedule,
  reminders,
  stepIndex,
  stepCount,
  isSubmitting,
  errorMessage,
  onReminderEnabledChange,
  onEnable,
  onSkip,
  onBack,
}: NotificationPermissionScreenProps) {
  const enabledCount = Object.values(reminders).filter(
    (reminder) => reminder.enabled,
  ).length;

  return (
    <OnboardingScreenLayout
      title="Stay on track with your daily plan"
      subtitle="Users who set reminders breathe 2x more consistently."
      progress={stepIndex / stepCount}
      onBack={onBack}
      onSkip={onSkip}
      footer={
        <OnboardingPrimaryButton
          label={
            enabledCount === 0
              ? 'Continue without reminders'
              : `Enable ${enabledCount} ${enabledCount === 1 ? 'reminder' : 'reminders'}`
          }
          loading={isSubmitting}
          onPress={onEnable}
        />
      }
    >
      <View style={styles.content}>
        <View style={styles.reminderCards}>
          {DAILY_REMINDER_DEFINITIONS.map((definition) => {
            const time = schedule.actions[definition.scheduleActionId];

            return (
              <ReminderCard
                key={definition.id}
                label={definition.onboardingTitle}
                time={formatDailyPlanTime(time, time)}
                enabled={reminders[definition.id].enabled}
                disabled={isSubmitting}
                onToggle={(enabled) => {
                  onReminderEnabledChange(definition.id, enabled);
                }}
              />
            );
          })}
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </View>
    </OnboardingScreenLayout>
  );
}

function ReminderCard({
  label,
  time,
  enabled,
  disabled,
  onToggle,
}: {
  label: string;
  time: string;
  enabled: boolean;
  disabled: boolean;
  onToggle: (enabled: boolean) => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={styles.cardTime}>{time}</Text>
      </View>
      <Switch
        accessibilityLabel={`${label} reminder`}
        value={enabled}
        disabled={disabled}
        onValueChange={onToggle}
        trackColor={{
          false: colors.neutral[300],
          true: colors.primary.blue300,
        }}
        thumbColor={colors.background.elevated}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  reminderCards: {
    gap: spacing.md,
  },
  card: {
    ...card.base,
    backgroundColor: colors.background.elevated,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: 22,
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
  cardTime: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
  },
  errorText: {
    ...typography.body.small,
    color: colors.error[500],
    textAlign: 'center',
  },
});
