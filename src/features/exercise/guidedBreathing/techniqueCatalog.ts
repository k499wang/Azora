/**
 * The technique id registry. This file mirrors the
 * `public.breathing_technique_catalog` table exactly — `breathing_sessions`
 * has a foreign key onto it, so an id that lives here but not in the database
 * makes `complete_breathing_session` reject the write. The client treats that
 * rejection as a background error, which means the user sees a finished
 * session that never counted. `techniqueCatalog.test.mjs` fails the build when
 * the two lists drift.
 *
 * To add an exercise: add the id here, add the matching row in a new
 * migration, then add the presentation entry in `techniques.ts`.
 *
 * Never rename an existing id. Every historical `breathing_sessions` row
 * stores it, so a rename orphans that user's history.
 *
 * Kept free of asset `require()` calls so it can be imported from Node tests.
 */
export const TECHNIQUE_CATALOG = [
  { id: 'box', displayName: 'Box Breathing' },
  { id: '478', displayName: '4-7-8 Breathing' },
  { id: 'wimhof', displayName: 'Wim Hof' },
  { id: 'resonance', displayName: 'Resonance' },
  { id: 'relaxing', displayName: 'Relaxing Breath' },
  { id: 'belly', displayName: 'Belly Breathing' },
  { id: 'extended-exhale', displayName: 'Extended Exhale' },
  { id: 'sitali', displayName: 'Cooling Breath' },
  { id: 'triangle', displayName: 'Triangle Breathing' },
  { id: 'deep-box', displayName: 'Deep Box' },
  { id: 'bhastrika', displayName: 'Bellows Breath' },
  { id: 'morning-charge', displayName: 'Morning Charge' },
  { id: 'night-settle', displayName: 'Night Settle' },
  { id: 'sleep-descent', displayName: 'Sleep Descent' },
  { id: 'coherent-6', displayName: 'Coherent 6' },
] as const;

export type TechniqueId = (typeof TECHNIQUE_CATALOG)[number]['id'];

export const TECHNIQUE_IDS: readonly TechniqueId[] = TECHNIQUE_CATALOG.map(
  (entry) => entry.id,
);

export function isTechniqueId(value: string | null | undefined): value is TechniqueId {
  return value != null && TECHNIQUE_IDS.includes(value as TechniqueId);
}
