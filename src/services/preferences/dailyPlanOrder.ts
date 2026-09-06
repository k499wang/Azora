import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  sanitizeDailyPlanOrder,
  type DailyPlanActionId,
} from '../dailyPlan/dailyPlanScheduleCore';

/**
 * The order the user dragged the three dailies into, kept on the device.
 *
 * Deliberately not the schedule. The hours a daily happens at are a real
 * setting — they are what the reminders fire on and what the card says — so
 * arranging the list must not touch them. Which order they are read in is a
 * preference about this screen and nothing else, and it is worth remembering
 * without being worth a column or a round trip.
 */
const DAILY_PLAN_ORDER_KEY = 'dailyPlan:order';

/**
 * Read once and held, the way the haptics preference is, so the section has its
 * order on the first frame it draws. Without it Home would lay the three
 * dailies out by their hours and re-order them a tick later, which reads as the
 * list rearranging itself in front of you.
 */
let cached: DailyPlanActionId[] | null = null;

/**
 * Read at most once. A later mount is handed the same value rather than a fresh
 * copy of it: parsing storage again would hand React a new object with the same
 * contents, and a render to go with it.
 */
let loaded = false;

/** what is known right now — null until the first read comes back */
export function dailyPlanOrderNow(): DailyPlanActionId[] | null {
  return cached;
}

export async function loadDailyPlanOrder(): Promise<DailyPlanActionId[] | null> {
  if (loaded) return cached;
  try {
    const raw = await AsyncStorage.getItem(DAILY_PLAN_ORDER_KEY);
    cached = raw == null ? null : sanitizeDailyPlanOrder(JSON.parse(raw));
  } catch {
    // The dailies still have an order without this — the one the day gives them.
    cached = null;
  }
  loaded = true;
  return cached;
}

export async function saveDailyPlanOrder(
  order: DailyPlanActionId[],
): Promise<void> {
  const kept = sanitizeDailyPlanOrder(order);
  if (kept == null) return;
  cached = kept;
  loaded = true;

  try {
    await AsyncStorage.setItem(DAILY_PLAN_ORDER_KEY, JSON.stringify(kept));
  } catch {
    // Nothing to recover: the arrangement stands for this session and the
    // dailies fall back to their hours next launch.
  }
}

// Primed at import so the first Home render already has it.
void loadDailyPlanOrder().catch(() => {});
