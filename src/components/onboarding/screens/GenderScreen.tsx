import { GENDER_OPTIONS, type GenderOption } from '../data/genderOptions';
import AzoAside from '../AzoAside';
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
      title=""
      titleSlot={
        <AzoAside
          text="How do you identify?"
          variant="question"
          expression="listening"
          wearing="glasses"
          holding="notes"
          delayMs={160}
        />
      }
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
