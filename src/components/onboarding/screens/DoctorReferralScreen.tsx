import { colors } from '../../../theme/colors';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingOptionCardGrid, {
  type OnboardingOptionCard,
} from '../OnboardingOptionCardGrid';

export type DoctorReferral = 'doctor' | 'no';

const OPTIONS: OnboardingOptionCard<DoctorReferral>[] = [
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
      subtitle="Referrals from clinicians help us know what to build next."
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
      <OnboardingOptionCardGrid
        options={OPTIONS}
        selectedIds={value ? [value] : []}
        onSelect={onSelect}
      />
    </OnboardingScreenLayout>
  );
}
