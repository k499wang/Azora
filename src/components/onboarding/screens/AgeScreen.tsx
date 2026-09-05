import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingOptionList, {
  type OnboardingOption,
} from '../OnboardingOptionList';
import MochiAside from '../MochiAside';
import { colors } from '../../../theme/colors';

/**
 * The age is stored as a number, so each band reports its own midpoint — close
 * enough for the banding the profile actually uses, and it keeps every consumer
 * of `age` unchanged.
 */
type AgeBandId = '13' | '18' | '25' | '35' | '45' | '55' | '65';

const AGE_BANDS: (OnboardingOption<AgeBandId> & {
  min: number;
  max: number;
  midpoint: number;
})[] = [
  { id: '13', title: '13 to 17', min: 13, max: 17, midpoint: 15, accent: colors.playful.sky.base },
  { id: '18', title: '18 to 24', min: 18, max: 24, midpoint: 21, accent: colors.playful.teal.base },
  { id: '25', title: '25 to 34', min: 25, max: 34, midpoint: 30, accent: colors.playful.violet.base },
  { id: '35', title: '35 to 44', min: 35, max: 44, midpoint: 40, accent: colors.playful.blush.base },
  { id: '45', title: '45 to 54', min: 45, max: 54, midpoint: 50, accent: colors.playful.amber.base },
  { id: '55', title: '55 to 64', min: 55, max: 64, midpoint: 60, accent: colors.playful.coral.base },
  { id: '65', title: '65 or older', min: 65, max: 120, midpoint: 70, accent: colors.accent[600] },
];

interface AgeScreenProps {
  value: number;
  stepIndex: number;
  stepCount: number;
  onChange: (value: number) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

export default function AgeScreen({
  value,
  stepIndex,
  stepCount,
  onChange,
  onContinue,
  onBack,
  onSkip,
}: AgeScreenProps) {
  const selectedBand = AGE_BANDS.find(
    (band) => value >= band.min && value <= band.max,
  );

  return (
    <OnboardingScreenLayout
      title=""
      titleSlot={
        <MochiAside
          text="How old are you?"
          variant="question"
          expression="happy"
          holding="notes"
          delayMs={160}
        />
      }
      progress={stepIndex / stepCount}
      onBack={onBack}
      onSkip={onSkip}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <OnboardingOptionList
        options={AGE_BANDS}
        selectedIds={
          selectedBand ? [selectedBand.id] : []
        }
        onSelect={(id) => {
          const band = AGE_BANDS.find((candidate) => candidate.id === id);
          if (band) onChange(band.midpoint);
        }}
      />
    </OnboardingScreenLayout>
  );
}
