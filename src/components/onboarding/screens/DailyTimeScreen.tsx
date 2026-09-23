import { colors } from '../../../theme/colors';
import OnboardingChoiceScreen from '../OnboardingChoiceScreen';
import type { OnboardingOption } from '../OnboardingOptionList';

interface DailyTimeScreenProps {
  value: number;
  stepIndex: number;
  stepCount: number;
  onChange: (value: number) => void;
  onContinue: (minutes: number) => void;
  onBack: () => void;
  onSkip?: () => void;
}

/**
 * The plan is built from a number of minutes, so each band reports the middle
 * of its own range and every consumer of `dailyMinutes` stays unchanged.
 */
type DailyTimeId = '3' | '5' | '10' | '15' | '20';

export const DAILY_TIME_BANDS: (OnboardingOption<DailyTimeId> & {
  min: number;
  max: number;
  minutes: number;
})[] = [
  { id: '3', title: 'A couple of minutes', min: 0, max: 4, minutes: 3, accent: colors.playful.sky.base, echo: 'A couple of minutes a day' },
  { id: '5', title: 'About 5 minutes', min: 5, max: 7, minutes: 5, accent: colors.playful.teal.base, echo: 'About five minutes a day' },
  { id: '10', title: 'About 10 minutes', min: 8, max: 12, minutes: 10, accent: colors.playful.violet.base, echo: 'About ten minutes a day' },
  { id: '15', title: 'About 15 minutes', min: 13, max: 17, minutes: 15, accent: colors.playful.amber.base, echo: 'About fifteen minutes a day' },
  { id: '20', title: '20 minutes or more', min: 18, max: 120, minutes: 20, accent: colors.playful.coral.base, echo: 'Twenty minutes a day' },
];

/** The band the plan's minutes came from, said as the shape of a day. */
export function dailyMinutesEcho(minutes: number): string | null {
  return DAILY_TIME_BANDS.find((band) => band.minutes === minutes)?.echo ?? null;
}

export default function DailyTimeScreen({
  value,
  stepIndex,
  stepCount,
  onChange,
  onContinue,
  onBack,
  onSkip,
}: DailyTimeScreenProps) {
  const selected = DAILY_TIME_BANDS.find(
    (band) => value >= band.min && value <= band.max,
  );

  return (
    <OnboardingChoiceScreen
      question="How much time can you give every day?"
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
