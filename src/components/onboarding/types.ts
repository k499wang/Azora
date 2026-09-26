import type { IconName } from '../common/icons/Icon';

export type OnboardingStep =
  | 'azoIntro'
  | 'azoMoved'
  | 'azoNewRoom'
  | 'azoBusy'
  | 'azoFresh'
  | 'azoPlan'
  | 'personalizeIntro'
  | 'support'
  | 'mochiPlace'
  | 'mochiFloor'
  | 'mochiRooms'
  | 'mochiHouse'
  | 'intent'
  | 'intentPriority'
  | 'intentReflection'
  | 'intentDepth1'
  | 'intentDepth2'
  | 'intentDepth3'
  | 'piecesTogether'
  | 'analyzeIntent'
  | 'brainScience'
  | 'name'
  | 'greeting'
  | 'acquisitionSource'
  | 'attPriming'
  | 'stress'
  | 'overwhelmResponse'
  | 'supportSystem'
  | 'hiddenDrain'
  | 'childhoodStress'
  | 'lifeEvents'
  | 'sleep'
  | 'sleepDuration'
  | 'wakeEase'
  | 'dayEnergy'
  | 'sleepCause'
  | 'analyzeSleep'
  | 'sleepInsight'
  | 'dayActivity'
  | 'brainFog'
  | 'routineHappiness'
  | 'choresOverwhelm'
  | 'distraction'
  | 'fallingBehind'
  | 'beforeAfter'
  | 'scrollInstead'
  | 'socialMedia'
  | 'mentalHealth'
  | 'analyzeLoad'
  | 'homeFeeling'
  | 'halfway'
  | 'procrastinationArea'
  | 'procrastinationReason'
  | 'age'
  | 'gender'
  | 'analyzeDays'
  | 'habitsFocusInsight'
  | 'putOffGuilt'
  | 'habitsFocusScience1'
  | 'habitsFocusScience2'
  | 'habitsFocusScience3'
  | 'consistency'
  | 'expertReview'
  | 'communityProof'
  | 'dailyTime'
  | 'wakeTime'
  | 'sleepTime'
  | 'doctorReferral'
  | 'planBoost'
  | 'stressAwareness'
  | 'breathingFamiliarity'
  | 'cbtFamiliarity'
  | 'heartVariability'
  | 'stressSignal'
  | 'planIntro'
  | 'planLoading'
  | 'diagnosis'
  | 'recommendedExercise'
  | 'recommendedHabits'
  | 'habitCurve'
  | 'scienceCredibility'
  | 'goalProof'
  | 'pact'
  | 'notifications'
  | 'paywall';

/**
 * The goals a user can pick during onboarding, and the single source of truth
 * for that set. Adding a goal here is what forces the rest of the app to
 * account for it — most importantly `INTENT_TECHNIQUE` in
 * `src/features/exercise/guidedBreathing/techniqueSelection.ts`, which will not
 * compile until the new goal has an exercise. Without that chain a new goal
 * silently falls through to the `other` default at runtime.
 */
export type OnboardingIntent =
  | 'stress_relief'
  | 'calm_fast'
  | 'sleep'
  | 'focus'
  | 'energy'
  | 'self_acceptance'
  | 'emotional_balance'
  | 'self_care'
  | 'spiritual'
  | 'yoga'
  | 'heart_health'
  | 'cleaning'
  | 'daily_habit'
  | 'other';

export interface IntentOption {
  id: OnboardingIntent;
  icon: IconName;
  accent: string;
  title: string;
  /** Previous titles accepted when restoring goals saved before a copy update. */
  legacyTitles?: readonly string[];
  body: string;
}

export interface IntentValuePoint {
  icon: IconName;
  accent: string;
  label: string;
}

export interface PersonalizedIntentOption extends IntentOption {
  hook: string;
  goalPhrase: string;
  assessmentPlan: string;
  reflectionHeadline: string;
  reflectionBody: string;
  valuePoints: IntentValuePoint[];
}
