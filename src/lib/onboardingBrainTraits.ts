import type { OnboardingOptionIconName } from '../components/onboarding/OnboardingOptionIcon';
import type {
  DistractionId,
  ProcrastinationReasonId,
  ScrollInsteadId,
  SelfDisciplineId,
  StressSignalId,
  StruggleId,
  UntappedPotentialId,
} from '../components/onboarding/data/routineOptions';

export interface BrainTrait {
  id: string;
  icon: OnboardingOptionIconName;
  name: string;
  noticed: string;
  strength: string;
}

/** Answers onboarding already asks; each trait is read from these, never asked on its own. */
export interface BrainTraitAnswers {
  struggles: readonly StruggleId[];
  procrastinationReasons: readonly ProcrastinationReasonId[];
  stressSignal: StressSignalId | null;
  distraction: DistractionId | null;
  scrollInstead: ScrollInsteadId | null;
  selfDiscipline: SelfDisciplineId | null;
  untappedPotential: UntappedPotentialId | null;
}

const TRAITS: readonly (BrainTrait & { shows: (answers: BrainTraitAnswers) => boolean })[] = [
  {
    id: 'timeSense',
    icon: 'timer-sand',
    name: 'Time slips by',
    noticed: 'Time moves differently for you, so deadlines sneak up.',
    strength: 'You sprint brilliantly when it counts.',
    shows: (a) => a.struggles.includes('timeManagement'),
  },
  {
    id: 'startFriction',
    icon: 'discipline-fading-rocket',
    name: 'Slow to start',
    noticed: 'Starting is the hardest part, even for things you want to do.',
    strength: 'Once you’re moving, you move fast.',
    shows: (a) =>
      a.stressSignal === 'frozen' ||
      a.struggles.includes('procrastination') ||
      a.procrastinationReasons.some((reason) => reason === 'start' || reason === 'overwhelmed'),
  },
  {
    id: 'allOrNothingFocus',
    icon: 'focus-interrupted',
    name: 'All-or-nothing focus',
    noticed: 'Your focus is either everywhere or completely locked in.',
    strength: 'When something grabs you, you go deeper than anyone.',
    shows: (a) =>
      a.stressSignal === 'scatteredFocus' ||
      a.distraction === 'often' ||
      a.distraction === 'constant' ||
      a.procrastinationReasons.includes('focus'),
  },
  {
    id: 'outOfSight',
    icon: 'eye-off-outline',
    name: 'Out of sight, out of mind',
    noticed: 'Anything you can’t see tends to slip away.',
    strength: 'You think in pictures and connections.',
    shows: (a) => a.selfDiscipline === 'needStructure',
  },
  {
    id: 'feelsDeeply',
    icon: 'heart',
    name: 'Feels it deeply',
    noticed: 'A small comment can stay with you for days.',
    strength: 'You read people well and care hard.',
    shows: (a) => a.struggles.includes('notGoodEnough'),
  },
  {
    id: 'quickToAct',
    icon: 'cellphone',
    name: 'Quick to act',
    noticed: 'Your hands get there before your decision does.',
    strength: 'You’re spontaneous and quick on your feet.',
    shows: (a) =>
      a.scrollInstead === 'often' ||
      a.scrollInstead === 'always' ||
      a.struggles.includes('screenTime'),
  },
  {
    id: 'perfectOrNothing',
    icon: 'star',
    name: 'Perfect or nothing',
    noticed: 'Fear of getting it wrong can stop you starting.',
    strength: 'Your standards are genuinely high.',
    shows: (a) => a.struggles.includes('perfectionism') || a.procrastinationReasons.includes('failing'),
  },
  {
    id: 'giftedKid',
    icon: 'sparkle',
    name: 'Untapped potential',
    noticed: 'You know there’s more in you than your days show.',
    strength: 'You learn fast once it’s okay to be a beginner.',
    shows: (a) => a.untappedPotential === 'yes' || a.untappedPotential === 'absolutely',
  },
];

export function brainTraitsFromAnswers(answers: BrainTraitAnswers): BrainTrait[] {
  return TRAITS.filter((trait) => trait.shows(answers)).map(({ shows: _, ...trait }) => trait);
}
