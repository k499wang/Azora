import { colors } from '../../../theme/colors';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingOptionList, {
  type OnboardingOption,
} from '../OnboardingOptionList';

export type ExperienceLevel = 'never' | 'little' | 'regular';

const OPTIONS: OnboardingOption<ExperienceLevel>[] = [
  {
    id: 'never',
    icon: 'sprout-outline',
    accent: colors.playful.teal.base,
    title: 'New to this',
  },
  {
    id: 'little',
    icon: 'waves',
    accent: colors.playful.sky.base,
    title: 'Dabbled a bit',
  },
  {
    id: 'regular',
    icon: 'meditation',
    accent: colors.playful.violet.base,
    title: 'I practice regularly',
  },
];

interface ExperienceScreenProps {
  value: ExperienceLevel | null;
  stepIndex: number;
  stepCount: number;
  onSelect: (value: ExperienceLevel) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

export default function ExperienceScreen({
  value,
  stepIndex,
  stepCount,
  onSelect,
  onContinue,
  onBack,
  onSkip,
}: ExperienceScreenProps) {
  return (
    <OnboardingScreenLayout
      title="Have you done anything like this before?"
      subtitle="We'll tailor the app to your experience."
      progress={stepIndex / stepCount}
      onBack={onBack}
      onSkip={onSkip}
      footer={
        <OnboardingPrimaryButton
          label="Continue"
          onPress={onContinue}
          disabled={value == null}
        />
      }
    >
      <OnboardingOptionList
        options={OPTIONS}
        selectedIds={value ? [value] : []}
        onSelect={onSelect}
      />
    </OnboardingScreenLayout>
  );
}
