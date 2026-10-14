import { StyleSheet, View } from 'react-native';
import { Text } from '../../common/Text';
import Icon from '../../common/icons/Icon';
import { onboardingPlanBenefits } from '../../../lib/onboardingPlanBenefits';
import type { OnboardingPreset } from '../../../lib/onboardingPreset';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import type { OnboardingIntent } from '../types';

interface Props {
  preset: OnboardingPreset;
  intent: OnboardingIntent;
  goalPhrase: string;
  triedEcho?: string | null;
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

const PLAN_STEPS = [
  { icon: 'walk', title: 'Start small', body: 'Follow a manageable action instead of tackling everything at once.' },
  { icon: 'book', title: 'Learn as you go', body: 'Short lessons and guided Resets support the goal you chose.' },
  { icon: 'calendar-check-outline', title: 'Keep your place', body: 'Work through your plan step by step. Miss a day? Pick up where you left off.' },
] as const;

export default function PlanApproachScreen({
  preset, intent, goalPhrase, triedEcho, stepIndex, stepCount, onContinue, onBack,
}: Props) {
  const benefits = onboardingPlanBenefits(preset, intent, goalPhrase, triedEcho);

  return (
    <OnboardingScreenLayout
      title="A clear next step, each day."
      subtitle={`Your priority: ${benefits.goal}.`}
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="See my plan" onPress={onContinue} />}
    >
      <View style={styles.content}>
        <Text style={styles.approach}>{benefits.approach}</Text>
        {benefits.triedNote != null && <Text style={styles.detail}>{benefits.triedNote}</Text>}
        {PLAN_STEPS.map(({ icon, title, body }) => (
          <View key={title} style={styles.step}>
            <Icon name={icon} size={26} color={colors.primary.blue500} />
            <View style={styles.stepCopy}>
              <Text style={styles.stepTitle}>{title}</Text>
              <Text style={styles.detail}>{body}</Text>
            </View>
          </View>
        ))}
        <Text style={styles.duration}>Your plan runs for {preset.weeks} weeks, at your own pace.</Text>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  approach: { ...typography.body.medium, color: colors.text.primary },
  step: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  stepCopy: { flex: 1, gap: spacing.xs },
  stepTitle: { ...typography.heading.heading2, color: colors.text.primary },
  detail: { ...typography.body.small, color: colors.text.secondary },
  duration: { ...typography.label.medium, color: colors.primary.blue500 },
});
