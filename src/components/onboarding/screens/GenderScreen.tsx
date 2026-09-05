import { GENDER_OPTIONS, type GenderOption } from '../data/genderOptions';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingOptionList from '../OnboardingOptionList';
import type { OnboardingOptionIconName } from '../OnboardingOptionIcon';

const GENDER_ICONS: Record<GenderOption['id'], OnboardingOptionIconName> = {
  female: 'gender-female',
  male: 'gender-male',
  nonbinary: 'gender-non-binary',
  prefer_not: 'help-circle-outline',
};

interface GenderScreenProps {
  value: GenderOption['id'] | null;
  stepIndex: number;
  stepCount: number;
  onSelect: (id: GenderOption['id']) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

export default function GenderScreen({
  value,
  stepIndex,
  stepCount,
  onSelect,
  onContinue,
  onBack,
  onSkip,
}: GenderScreenProps) {
  return (
    <OnboardingScreenLayout
      title="How do you identify?"
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
        options={GENDER_OPTIONS.map((option) => ({
          id: option.id,
          title: option.title,
          accent: option.accent,
          icon: GENDER_ICONS[option.id],
        }))}
        selectedIds={value ? [value] : []}
        onSelect={onSelect}
      />
    </OnboardingScreenLayout>
  );
}
