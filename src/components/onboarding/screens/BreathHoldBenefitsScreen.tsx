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

const BENEFITS: BreathHoldBenefit[] = [
  {
    icon: 'lungs',
    text: 'Estimate your lung age',
  },
  {
    icon: 'molecule-co2',
    text: 'Build tolerance to rising CO₂',
  },
  {
    icon: 'battery-heart-outline',
    text: 'Support relaxation and stress regulation',
  },
  {
    icon: 'weather-windy',
    text: 'Build control you can call on any time',
  },
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
      title="Why Azorians run The Azora Protocol."
      subtitle="A calm, guided session to establish your personal baseline."
      progress={stepIndex / stepCount}
      onBack={onBack}
      onSkip={onSkip}
      footer={<OnboardingPrimaryButton label="Begin my first Protocol" onPress={onContinue} />}
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
