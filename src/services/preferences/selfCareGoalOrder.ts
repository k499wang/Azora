import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SelfCareGoalPlaces } from '../../features/selfCare/domain/selfCareGoal';

/**
 * Where the user dragged each to-do, kept on the device.
 *
 * The order of a checklist is a preference, not a record: it is worth
 * remembering and not worth a column, a migration, or a round trip before the
 * row can settle under the finger that dropped it. Losing it on a new phone
 * costs the list nothing — every to-do without a place falls back to the part
 * of the day it was written for, which is the order the list had before anyone
 * could drag it at all.
 */
const SELF_CARE_GOAL_ORDER_KEY = 'selfCare:goal_order';

/**
 * A last-resort valve on a map that is only ever twenty entries of live to-dos.
 * A place is forgotten when its to-do is removed, so this is only reached by a
 * to-do removed on another device — and then it drops the oldest first.
 */
const MAX_PLACES = 200;

/**
 * Read once and held, the way the haptics preference is, so the list has its
 * order on the first frame it draws. Without it every mount would lay the
 * to-dos out by their hours and then re-order them a tick later, which reads as
 * the list rearranging itself in front of you.
 */
let cached: SelfCareGoalPlaces = {};

/**
 * Read at most once. A later mount is handed the same value rather than a fresh
 * copy of it: parsing storage again would hand React a new object with the same
 * contents, and a render to go with it.
 */
let loaded = false;

/** what is known right now — empty until the first read comes back */
export function selfCareGoalPlacesNow(): SelfCareGoalPlaces {
  return cached;
}

/** Storage is free text and outlives the version that wrote it. */
function sanitize(raw: unknown): SelfCareGoalPlaces {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return {};

  const places: SelfCareGoalPlaces = {};
  for (const [goalId, place] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof place === 'number' && Number.isFinite(place)) {
      places[goalId] = place;
    }
  }
  return places;
}

export async function loadSelfCareGoalPlaces(): Promise<SelfCareGoalPlaces> {
  if (loaded) return cached;
  try {
    const raw = await AsyncStorage.getItem(SELF_CARE_GOAL_ORDER_KEY);
    cached = raw == null ? {} : sanitize(JSON.parse(raw));
  } catch {
    // The list still has an order without this — the one its hours give it.
    cached = {};
  }
  loaded = true;
  return cached;
}

export async function saveSelfCareGoalPlaces(
  places: SelfCareGoalPlaces,
): Promise<void> {
  const keys = Object.keys(places);
  loaded = true;
  cached =
    keys.length <= MAX_PLACES
      ? places
      : Object.fromEntries(
          keys.slice(keys.length - MAX_PLACES).map((key) => [key, places[key]]),
        );

  try {
    await AsyncStorage.setItem(SELF_CARE_GOAL_ORDER_KEY, JSON.stringify(cached));
  } catch {
    // Nothing to recover: the drag stands for this session and the list falls
    // back to its hours next launch.
  }
}

// Primed at import so the first Home render already has it. The read swallows
// its own failures, and the catch here is the same belt the haptics preference
// wears: nothing about a checklist's order is worth an unhandled rejection at
// startup.
void loadSelfCareGoalPlaces().catch(() => {});
