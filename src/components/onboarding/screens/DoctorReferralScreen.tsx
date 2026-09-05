import { colors } from '../../../theme/colors';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingOptionList, {
  type OnboardingOption,
} from '../OnboardingOptionList';

export type DoctorReferral = 'doctor' | 'no';

const OPTIONS: OnboardingOption<DoctorReferral>[] = [
  {
    id: 'doctor',
    icon: 'stethoscope',
    accent: colors.playful.teal.base,
    title: 'Yes',
  },
  {
    id: 'no',
    icon: 'close-circle-outline',
    accent: colors.accent[600],
    title: 'No',
  },
];

interface DoctorReferralScreenProps {
  value: DoctorReferral | null;
  stepIndex: number;
  stepCount: number;
  onSelect: (value: DoctorReferral) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

export default function DoctorReferralScreen({
  value,
  stepIndex,
  stepCount,
  onSelect,
  onContinue,
  onBack,
  onSkip,
}: DoctorReferralScreenProps) {
  return (
    <OnboardingScreenLayout
      title="Was Azora recommended to you by a doctor?"
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
