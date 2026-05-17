import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import TimePickerField from '../../common/TimePickerField';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
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
      title="Build your breathing habit"
      subtitle="Azora can send one gentle reminder a day so your practice does not slip."
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={
        <View style={styles.footer}>
          <OnboardingPrimaryButton
            label="Enable reminder"
            loading={isSubmitting}
            onPress={() => onEnable(preferences)}
          />
          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={onSkip}
            style={({ pressed }) => [
              styles.skipButton,
              pressed && styles.skipButtonPressed,
              isSubmitting && styles.disabled,
            ]}
          >
            <Text style={styles.skipText}>Not now</Text>
          </Pressable>
        </View>
      }
    >
      <View style={styles.content}>
        <ReminderCard
          enabled={enabled}
          time={time}
          onToggle={setEnabled}
          onTimeChange={setTime}
        />

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </View>
    </OnboardingScreenLayout>
  );
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
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <MaterialCommunityIcons
            name="bell-outline"
            size={22}
            color={colors.primary.blue600}
          />
          <View style={styles.cardCopy}>
            <Text style={styles.cardTitle}>Daily reminder</Text>
            <Text style={styles.cardSubtitle}>
              One nudge a day at the time you choose.
            </Text>
          </View>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: colors.neutral[300], true: colors.primary.blue300 }}
          thumbColor={enabled ? colors.primary.blue600 : colors.neutral[50]}
        />
      </View>

      <TimePickerField
        value={time}
        onChange={onTimeChange}
        disabled={!enabled}
        accessibilityLabel="Daily reminder time"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.elevated,
    padding: spacing.md,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  cardTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardCopy: {
    flex: 1,
  },
  cardTitle: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
  },
  cardSubtitle: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  errorText: {
    ...typography.body.small,
    color: colors.error[500],
    textAlign: 'center',
  },
  footer: {
    gap: spacing.sm,
  },
  skipButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonPressed: {
    opacity: 0.6,
  },
  skipText: {
    ...typography.button.medium,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  disabled: {
    opacity: 0.45,
  },
});
