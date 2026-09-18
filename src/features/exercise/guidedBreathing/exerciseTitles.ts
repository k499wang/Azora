import type { BreathingTechnique } from './techniques';

/**
 * What the app calls each exercise when it is speaking to the user.
 *
 * Not the technique's own name. "Box Breathing" is what the pattern is called;
 * "Focus Reset" is what it is for, and the second is the only one a row on Home
 * has ever shown. Kept here rather than in the screen that draws the rows,
 * because onboarding now writes the same names onto the plan it hands over, and
 * a plan whose lines are named differently from the rows they become is two
 * plans.
 */
const EXERCISE_TITLES: Record<BreathingTechnique['id'], string> = {
  box: 'Focus Reset',
  '478': 'Sleep Reset',
  wimhof: 'Energy Reset',
  resonance: 'Balance Reset',
  relaxing: 'Stress Relief',
  belly: 'Grounding Exercise',
  'extended-exhale': 'Tension Release',
  sitali: 'Cooling Exercise',
  triangle: 'Concentration Reset',
  'deep-box': 'Deep Focus',
  bhastrika: 'Energy Activation',
  'morning-charge': 'Morning Reset',
  'night-settle': 'Evening Reset',
  'sleep-descent': 'Sleep Preparation',
  'coherent-6': 'Steady Rhythm',
};

/**
 * The name a row shows. Null resolves to a stand-in rather than a blank: the
 * caller is still loading, and a row that says nothing looks broken where one
 * that says something generic looks unfinished.
 */
export function resolveExerciseTitle(
  technique: BreathingTechnique | null,
): string {
  return technique == null ? 'Daily Mental Reset' : EXERCISE_TITLES[technique.id];
}

/** The same name, from the technique's id alone. */
export function exerciseTitleForTechniqueId(
  techniqueId: BreathingTechnique['id'],
): string {
  return EXERCISE_TITLES[techniqueId];
}
