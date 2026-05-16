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
  const [morningEnabled, setMorningEnabled] = useState(true);
  const [eveningEnabled, setEveningEnabled] = useState(true);
  const [morningTime, setMorningTime] = useState('08:00');
  const [eveningTime, setEveningTime] = useState('20:30');

  const preferences = useMemo<NotificationPreferences>(
    () => ({
      dailyReminders: {
        morning: {
          enabled: morningEnabled,
          time: morningTime,
        },
        evening: {
          enabled: eveningEnabled,
          time: eveningTime,
        },
      },
      trialEndingReminder: {
        enabled: true,
      },
    }),
    [eveningEnabled, eveningTime, morningEnabled, morningTime],
  );

  return (
    <OnboardingScreenLayout
      title="Build your breathing habit"
      subtitle="Azora can send gentle morning and evening reminders so your practice does not slip."
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={
        <View style={styles.footer}>
          <OnboardingPrimaryButton
            label="Enable reminders"
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
          icon="weather-sunny"
          title="Morning"
          subtitle="Start the day with a short reset."
          enabled={morningEnabled}
          time={morningTime}
          onToggle={setMorningEnabled}
          onTimeChange={setMorningTime}
        />
        <ReminderCard
          icon="weather-night"
          title="Evening"
          subtitle="Wind down before the day ends."
          enabled={eveningEnabled}
          time={eveningTime}
          onToggle={setEveningEnabled}
          onTimeChange={setEveningTime}
        />

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </View>
    </OnboardingScreenLayout>
  );
}

function ReminderCard({
  icon,
  title,
  subtitle,
  enabled,
  time,
  onToggle,
  onTimeChange,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle: string;
  enabled: boolean;
  time: string;
  onToggle: (enabled: boolean) => void;
  onTimeChange: (time: string) => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <MaterialCommunityIcons name={icon} size={22} color={colors.primary.blue600} />
          <View style={styles.cardCopy}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardSubtitle}>{subtitle}</Text>
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
        accessibilityLabel={`${title} reminder time`}
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
