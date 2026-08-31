import { Text } from '../../common/Text';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingOptionIcon, {
  type OnboardingOptionIconName,
} from '../OnboardingOptionIcon';

const ICON_SIZE = 24;

interface BreathHoldBenefitsScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

interface BreathHoldBenefit {
  icon: OnboardingOptionIconName;
  text: string;
}

/** what it is first, then what it does for him */
const BENEFITS: BreathHoldBenefit[] = [
  {
    icon: 'weather-windy',
    text: '3 deep inhales, 3 deep exhales, then hold your breath as long as you can',
  },
  { icon: 'molecule-co2', text: 'Builds your tolerance to rising CO₂' },
  {
    icon: 'battery-heart-outline',
    text: 'The long exhales settle your nervous system',
  },
  { icon: 'lungs', text: 'Tracks your lung age as it improves' },
];

export default function BreathHoldBenefitsScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
  onSkip,
}: BreathHoldBenefitsScreenProps) {
  return (
    <OnboardingScreenLayout
      title="Let’s try your first guided exercise."
      subtitle="It’s called The Azora Protocol."
      progress={stepIndex / stepCount}
      onBack={onBack}
      onSkip={onSkip}
      footer={
        <OnboardingPrimaryButton label="I’m ready" onPress={onContinue} />
      }
    >
      <View style={styles.list}>
        {BENEFITS.map((benefit, index) => (
          <View key={benefit.text} style={styles.row}>
            <OnboardingOptionIcon
              name={benefit.icon}
              size={ICON_SIZE}
              color={colors.primary.blue600}
            />
            <Text style={styles.text}>{benefit.text}</Text>
            {index < BENEFITS.length - 1 ? (
              <View style={styles.divider} />
            ) : null}
          </View>
        ))}
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md + spacing.xs,
    position: 'relative',
  },
  divider: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
  },
  text: {
    flex: 1,
    ...typography.body.medium,
    color: colors.text.primary,
  },
});
