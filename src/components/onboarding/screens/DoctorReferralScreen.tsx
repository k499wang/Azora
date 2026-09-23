import { colors } from '../../../theme/colors';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
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
    accent: colors.playful.stone.base,
    title: 'No',
  },
];

interface DoctorReferralScreenProps {
  value: DoctorReferral | null;
  stepIndex: number;
  stepCount: number;
  onSelect: (value: DoctorReferral) => void;
  onContinue: (id: DoctorReferral) => void;
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
      footer={null}
      onSkip={onSkip}
    >
      <OnboardingOptionList
        options={OPTIONS}
        selectedIds={value ? [value] : []}
        onSelect={(id) => {
          onSelect(id);
          onContinue(id);
        }}
      />
    </OnboardingScreenLayout>
  );
}
