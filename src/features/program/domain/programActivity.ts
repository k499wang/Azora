/**
 * What a program day can ask of someone.
 *
 * The plan prescribes an *activity*, never a screen and never a breathing
 * pattern. Today every authored activity happens to be breathing, and the one
 * thing that would make the next modality expensive is letting that accident
 * leak into the engine — a program that stores a `techniqueId` cannot schedule
 * a reflection without a second code path beside the first.
 *
 * So: a day names an activity id, an activity owns a `delivery` that only its
 * own modality understands, and the engine reads neither. Adding mood check-ins
 * or lessons is a new `delivery` variant plus the screen that renders it. The
 * catalogue, the resolver, the advancement rule and the stored snapshot all
 * stay untouched, because none of them ever looks inside.
 */

import {
  isTechniqueId,
  type TechniqueId,
} from '../../exercise/guidedBreathing/techniqueCatalog';

/**
 * The kinds of thing a plan can prescribe.
 *
 * Declared ahead of their delivery types on purpose: the list is the product
 * roadmap, and a modality named here with no delivery yet is a compile error at
 * the point someone tries to author one, which is where the reminder belongs.
 */
export type ProgramModality =
  | 'breathing'
  | 'reflection'
  | 'lesson'
  | 'movement'
  | 'lifeAction';

/** What counts as having done it, which each modality proves in its own way. */
export type ProgramCompletionUnit = 'session' | 'duration' | 'check';

export type ProgramIntensity =
  | 'restorative'
  | 'light'
  | 'moderate'
  | 'vigorous';

/** A guided breathing session, proven by a `breathing_sessions` row. */
export interface BreathingDelivery {
  modality: 'breathing';
  techniqueId: TechniqueId;
  minutes: number;
}

/**
 * A question the plan asks and stores the answer to — a mood check-in is one.
 * Not authored yet; the variant exists so the first one is data, not surgery.
 */
export interface ReflectionDelivery {
  modality: 'reflection';
  prompt: string;
  /** Answer shape the screen collects and the completion stores. */
  answer: 'scale' | 'choice' | 'text';
  choices?: readonly string[];
}

/** Something the plan teaches before it asks for anything. */
export interface LessonDelivery {
  modality: 'lesson';
  /** Sections rather than one blob, so a lesson can be read in parts. */
  sections: readonly { heading: string; body: string }[];
}

export type ProgramDelivery =
  | BreathingDelivery
  | ReflectionDelivery
  | LessonDelivery;

export interface ProgramActivityDefinition {
  id: string;
  /**
   * Bumped when the activity's meaning changes, never reused. Completions store
   * the revision they were performed against, so history keeps describing what
   * the user actually did after the activity is re-authored.
   */
  revision: number;
  title: string;
  estimatedSeconds: number;
  intensity: ProgramIntensity;
  completionUnit: ProgramCompletionUnit;
  /**
   * Authored alternatives, in order of preference, for when the activity is not
   * eligible — an acknowledgement not given, or equipment absent. The resolver
   * may choose one of these and nothing else.
   */
  fallbackActivityIds: readonly string[];
  delivery: ProgramDelivery;
}

export function activityModality(
  activity: ProgramActivityDefinition,
): ProgramModality {
  return activity.delivery.modality;
}

/**
 * The activities a plan day can be built from, by id.
 *
 * A registry rather than inline definitions on the day: the same activity
 * appears on many days of many plans, and copying it onto each one is how two
 * days of the same plan end up disagreeing about how long it takes.
 */
export type ProgramActivityRegistry = ReadonlyMap<
  string,
  ProgramActivityDefinition
>;

export function buildActivityRegistry(
  activities: readonly ProgramActivityDefinition[],
): ProgramActivityRegistry {
  const registry = new Map<string, ProgramActivityDefinition>();
  for (const activity of activities) {
    if (registry.has(activity.id)) {
      throw new Error(`Duplicate program activity id: ${activity.id}`);
    }
    registry.set(activity.id, activity);
  }
  return registry;
}

/**
 * Whether a finished piece of work proves a given activity was done.
 *
 * The engine asks this instead of comparing technique ids itself, which is what
 * keeps `advanceProgramDay` from needing to know that breathing exists. A
 * modality with no rule here cannot be completed by accident.
 */
export interface ProgramCompletionEvidence {
  modality: ProgramModality;
  /** Set for breathing: the technique whose session was written. */
  techniqueId?: string;
}

/**
 * The evidence that would satisfy this activity, as data.
 *
 * Written into the resolved snapshot so the server can check a completion
 * without knowing what a technique is, and without parsing meaning out of an
 * activity id. A new modality supplies its own criteria here and the storage,
 * the RPC and the snapshot all keep working.
 */
export function activityCompletionCriteria(
  activity: ProgramActivityDefinition,
): ProgramCompletionEvidence {
  const { delivery } = activity;
  switch (delivery.modality) {
    case 'breathing':
      return { modality: 'breathing', techniqueId: delivery.techniqueId };
    case 'reflection':
    case 'lesson':
      return { modality: delivery.modality };
  }
}

export function completionProvesActivity(
  activity: ProgramActivityDefinition,
  evidence: ProgramCompletionEvidence,
): boolean {
  const { delivery } = activity;
  if (delivery.modality !== evidence.modality) return false;

  switch (delivery.modality) {
    case 'breathing':
      return (
        isTechniqueId(evidence.techniqueId) &&
        evidence.techniqueId === delivery.techniqueId
      );
    // A reflection or a lesson is proven by having been submitted at all; there
    // is no second thing to check, and inventing one would mean a user could
    // answer honestly and still not advance.
    case 'reflection':
    case 'lesson':
      return true;
  }
}
