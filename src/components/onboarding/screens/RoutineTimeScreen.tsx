import { Text } from '../../common/Text';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Icon from '../../common/icons/Icon';
import { useTimePickerSheet } from '../../common/useTimePickerSheet';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts } from '../../../theme/typography';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

interface RoutineTimeScreenProps {
  title: string;
  subtitle: string;
  pickerTitle: string;
  value: string;
  stepIndex: number;
  stepCount: number;
  onChange: (value: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function RoutineTimeScreen({
  title,
  subtitle,
  pickerTitle,
  value,
  stepIndex,
  stepCount,
  onChange,
  onContinue,
  onBack,
}: RoutineTimeScreenProps) {
  const { open, sheet } = useTimePickerSheet({
    value,
    onChange,
    title: pickerTitle,
  });
  const displayTime = useMemo(() => formatTime(value), [value]);

  return (
    <OnboardingScreenLayout
      title={title}
      subtitle={subtitle}
      progress={stepIndex / stepCount}
      onBack={onBack}
      centerBody
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={styles.content}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit time, currently ${displayTime}`}
          accessibilityHint="Opens the system time picker"
          onPress={open}
          style={({ pressed }) => [styles.timeButton, pressed && styles.timeButtonPressed]}
        >
          <View style={styles.timeRow}>
            <Text style={styles.time}>{displayTime}</Text>
            <Icon name="pencil" size={32} color={colors.primary.blue600} />
          </View>
        </Pressable>
      </View>
      {sheet}
    </OnboardingScreenLayout>
  );
}

function formatTime(value: string): string {
  const [hourRaw, minute = '00'] = value.split(':');
  const hour = Number(hourRaw);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute} ${suffix}`;
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
  },
  timeButton: {
    minWidth: 240,
    minHeight: 112,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.985 }],
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  time: {
    fontSize: 60,
    lineHeight: 66,
    letterSpacing: -1,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    color: colors.primary.blue600,
  },
});
