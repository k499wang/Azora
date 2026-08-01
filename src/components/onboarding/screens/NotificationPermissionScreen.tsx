import { StyleSheet, Switch, View } from 'react-native';
import { Text } from '../../common/Text';
import type { DailyPlanSchedule } from '../../../services/dailyPlan/types';
import { formatDailyPlanTime } from '../../../services/dailyPlan/dailyPlanScheduleCore';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { card } from '../../../theme/card';
import { DAILY_REMINDER_DEFINITIONS } from '../../../services/notifications/notificationCatalog';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingScreenLayout from '../OnboardingScreenLayout';

interface NotificationPermissionScreenProps {
  schedule: DailyPlanSchedule;
  stepIndex: number;
  stepCount: number;
  isSubmitting: boolean;
  errorMessage: string | null;
  onEnable: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export default function NotificationPermissionScreen({
  schedule,
  stepIndex,
  stepCount,
  isSubmitting,
  errorMessage,
  onEnable,
  onSkip,
  onBack,
}: NotificationPermissionScreenProps) {
  return (
    <OnboardingScreenLayout
      title="Stay on track with your daily plan"
      subtitle="Get one reminder for each of your three daily exercises."
      progress={stepIndex / stepCount}
      onBack={onBack}
      onSkip={onSkip}
      footer={
        <OnboardingPrimaryButton
          label="Enable 3 reminders"
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
                enabled={definition.onboardingEnabled}
              />
            );
          })}
        </View>

        <Text style={styles.reassurance}>
          You can change the times or turn individual reminders off anytime in Settings.
        </Text>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </View>
    </OnboardingScreenLayout>
  );
}

function ReminderCard({
  label,
  time,
  enabled,
}: {
  label: string;
  time: string;
  enabled: boolean;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={styles.cardTime}>{time}</Text>
      </View>
      <View pointerEvents="none" accessibilityElementsHidden>
        <Switch
          value={enabled}
          trackColor={{
            false: colors.neutral[300],
            true: colors.primary.blue300,
          }}
          thumbColor={colors.background.elevated}
        />
      </View>
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
    ...card.shadow,
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
});
