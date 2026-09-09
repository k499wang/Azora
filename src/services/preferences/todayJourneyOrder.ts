import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TodayJourneyId } from '../../components/home/journey/todayJourneyOrder';

const TODAY_JOURNEY_ORDER_KEY = 'home:today_journey_order';

interface TodayJourneyOrderStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export const todayJourneyOrderKey = (userId: string): string =>
  `${TODAY_JOURNEY_ORDER_KEY}:${userId}`;

function parseStoredOrder(raw: string | null): TodayJourneyId[] | null {
  if (raw == null) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    // Corrupt preference data is safe to replace with the canonical default.
    return null;
  }
  if (!Array.isArray(value)) return null;
  return value.every((id) =>
    typeof id === 'string' &&
    (id.startsWith('exercise:') || id.startsWith('todo:'))
  ) ? value as TodayJourneyId[] : null;
}

export function createTodayJourneyOrderPreference(
  storage: TodayJourneyOrderStorage,
) {
  const cachedByUser = new Map<string, TodayJourneyId[] | null>();
  const loadedUsers = new Set<string>();
  const pendingLoads = new Map<string, Promise<TodayJourneyId[] | null>>();
  const pendingWrites = new Map<string, Promise<void>>();
  const revisions = new Map<string, number>();

  const now = (userId: string | null): TodayJourneyId[] | null =>
    userId == null ? null : cachedByUser.get(userId) ?? null;

  const load = async (userId: string): Promise<TodayJourneyId[] | null> => {
    if (loadedUsers.has(userId)) return cachedByUser.get(userId) ?? null;
    const pending = pendingLoads.get(userId);
    if (pending != null) return pending;
    const revision = revisions.get(userId) ?? 0;
    const request = (async () => {
      try {
        const raw = await storage.getItem(todayJourneyOrderKey(userId));
        const order = parseStoredOrder(raw);
        if ((revisions.get(userId) ?? 0) === revision) {
          cachedByUser.set(userId, order);
        }
        loadedUsers.add(userId);
        return cachedByUser.get(userId) ?? null;
      } catch {
        // Preserve the accepted preference behavior: an unreadable device
        // value falls back to the canonical Today order for this session.
        if ((revisions.get(userId) ?? 0) === revision) {
          cachedByUser.set(userId, null);
        }
        loadedUsers.add(userId);
        return cachedByUser.get(userId) ?? null;
      } finally {
        pendingLoads.delete(userId);
      }
    })();
    pendingLoads.set(userId, request);
    return request;
  };

  const save = async (
    userId: string,
    order: TodayJourneyId[],
  ): Promise<void> => {
    const snapshot = [...order];
    revisions.set(userId, (revisions.get(userId) ?? 0) + 1);
    cachedByUser.set(userId, snapshot);
    loadedUsers.add(userId);
    const pendingWrite = (pendingWrites.get(userId) ?? Promise.resolve())
      .then(() => storage.setItem(
        todayJourneyOrderKey(userId),
        JSON.stringify(snapshot),
      ))
      .catch(() => {
        // Keep the in-memory arrangement and allow the next queued save to try
        // storage again instead of inheriting a rejected promise.
      });
    pendingWrites.set(userId, pendingWrite);
    await pendingWrite;
  };

  const resetAfterOnboarding = (userId: string): Promise<void> =>
    save(userId, []);

  return { now, load, save, resetAfterOnboarding };
}

const todayJourneyOrderPreference = createTodayJourneyOrderPreference(AsyncStorage);

export const todayJourneyOrderNow = todayJourneyOrderPreference.now;
export const loadTodayJourneyOrder = todayJourneyOrderPreference.load;
export const saveTodayJourneyOrder = todayJourneyOrderPreference.save;
export const resetTodayJourneyOrderAfterOnboarding =
  todayJourneyOrderPreference.resetAfterOnboarding;
