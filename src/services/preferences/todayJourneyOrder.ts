import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TodayJourneyId } from '../../components/home/journey/todayJourneyOrder';

const TODAY_JOURNEY_ORDER_KEY = 'home:today_journey_order';
let cached: TodayJourneyId[] | null = null;
let loaded = false;

export function todayJourneyOrderNow(): TodayJourneyId[] | null {
  return cached;
}

export async function loadTodayJourneyOrder(): Promise<TodayJourneyId[] | null> {
  if (loaded) return cached;
  try {
    const raw = await AsyncStorage.getItem(TODAY_JOURNEY_ORDER_KEY);
    cached = raw == null ? null : JSON.parse(raw);
  } catch {
    cached = null;
  }
  loaded = true;
  return cached;
}

export async function saveTodayJourneyOrder(order: TodayJourneyId[]): Promise<void> {
  cached = order;
  loaded = true;
  try {
    await AsyncStorage.setItem(TODAY_JOURNEY_ORDER_KEY, JSON.stringify(order));
  } catch {
    // The current arrangement still stands for this session.
  }
}

void loadTodayJourneyOrder().catch(() => {});
