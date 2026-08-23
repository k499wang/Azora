import { Text } from '../../common/Text';
import { StyleSheet, View } from 'react-native';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingHapticSlider from '../OnboardingHapticSlider';
import MochiAside from '../MochiAside';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';

interface DailyTimeScreenProps {
  value: number;
  stepIndex: number;
  stepCount: number;
  onChange: (value: number) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

function descriptorFor(value: number): string {
  if (value === 0) return 'Even 30 seconds counts';
  if (value <= 3) return 'I just want a quick break';
  if (value <= 7) return 'I can make this a small daily reset';
  if (value <= 15) return 'I want a steady routine';
  if (value <= 24) return 'I’m serious about building this habit';
  return 'I’m really dedicated to this';
}

function accentForDailyTime(value: number): string {
  if (value <= 3) return colors.primary.blue500;
  if (value <= 7) return colors.success[500];
  if (value <= 15) return colors.warning[500];
  if (value <= 24) return colors.orange[500];
  return colors.error[500];
}

export default function DailyTimeScreen({
  value,
  stepIndex,
  stepCount,
  onChange,
  onContinue,
  onBack,
  onSkip,
}: DailyTimeScreenProps) {
  const accent = accentForDailyTime(value);

  return (
    <OnboardingScreenLayout
      title=""
      titleSlot={
        <MochiAside
          text="How much time can you give every day?"
          variant="question"
          expression="happy"
          holding="notes"
          delayMs={160}
        />
      }
      progress={stepIndex / stepCount}
      onBack={onBack}
      onSkip={onSkip}
      centerBody
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={styles.content}>
        <Text style={[styles.descriptor, { color: accent }]}>{descriptorFor(value)}</Text>

        <OnboardingHapticSlider
          min={0}
          max={30}
          value={value}
          unit={value === 0 ? 'sec / day' : 'min / day'}
          formatValue={(v) => (v === 0 ? '30' : `${v}`)}
          accent={accent}
          onChange={onChange}
        />

        <View style={styles.scaleRow}>
          <Text style={styles.scaleLabel}>30 sec</Text>
          <Text style={styles.scaleLabel}>Deep practice</Text>
        </View>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  descriptor: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 18,
    lineHeight: 22,
    color: colors.text.primary,
    textAlign: 'center',
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: -spacing.sm,
  },
  scaleLabel: {
    ...typography.body.small,
    fontSize: 12,
    color: colors.text.tertiary,
  },
});
