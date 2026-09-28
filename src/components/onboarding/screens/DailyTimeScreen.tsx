import { colors } from '../../../theme/colors';
import OnboardingChoiceScreen from '../OnboardingChoiceScreen';
import type { OnboardingOption } from '../OnboardingOptionList';

interface DailyTimeScreenProps {
  value: number;
  hasAnswered: boolean;
  stepIndex: number;
  stepCount: number;
  onChange: (value: number) => void;
  onContinue: (minutes: number) => void;
  onBack: () => void;
  onSkip?: () => void;
}

type DailyTimeId = '5' | '10' | '15' | '20';

export const DAILY_TIME_BANDS: (OnboardingOption<DailyTimeId> & {
  min: number;
  max: number;
  minutes: number;
})[] = [
  { id: '5', title: '5 min', min: 0, max: 7, minutes: 5, accent: colors.playful.teal.base, icon: 'walk', echo: 'Five minutes a day' },
  { id: '10', title: '10 min', min: 8, max: 12, minutes: 10, accent: colors.playful.violet.base, icon: 'run', echo: 'Ten minutes a day' },
  { id: '15', title: '15 min', min: 13, max: 17, minutes: 15, accent: colors.playful.amber.base, icon: 'streak', echo: 'Fifteen minutes a day' },
  { id: '20', title: '20 min', min: 18, max: 120, minutes: 20, accent: colors.playful.coral.base, icon: 'rocket-launch', echo: 'Twenty minutes a day' },
];

/** The band the plan's minutes came from, said as the shape of a day. */
export default function DailyTimeScreen({
  value,
  hasAnswered,
  stepIndex,
  stepCount,
  onChange,
  onContinue,
  onBack,
  onSkip,
}: DailyTimeScreenProps) {
  const selected = DAILY_TIME_BANDS.find(
    (band) => hasAnswered && value >= band.min && value <= band.max,
  );

  return (
    <OnboardingChoiceScreen
      question="What’s the daily goal you’ll keep, even on busy days?"
      expression="thinking"
      options={DAILY_TIME_BANDS}
      selectedIds={selected ? [selected.id] : []}
      stepIndex={stepIndex}
      stepCount={stepCount}
      onSelect={(id) => {
        const band = DAILY_TIME_BANDS.find((candidate) => candidate.id === id);
        if (band) onChange(band.minutes);
      }}
      onContinue={(id) => {
        const band = DAILY_TIME_BANDS.find((candidate) => candidate.id === id);
        if (band) onContinue(band.minutes);
      }}
      onBack={onBack}
      onSkip={onSkip}
    />
  );
}
