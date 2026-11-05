import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CoachingOfferVisits } from '../../features/coaching/domain/coachingOfferVisits';

const key = (userId: string) => `home:coaching_offer_days:${userId}`;

export async function loadCoachingOfferVisits(userId: string): Promise<CoachingOfferVisits | null> {
  const stored = await AsyncStorage.getItem(key(userId));
  return stored == null ? null : (JSON.parse(stored) as CoachingOfferVisits);
}

export async function saveCoachingOfferDismissed(userId: string): Promise<void> {
  const visits = await loadCoachingOfferVisits(userId);
  if (visits != null) await saveCoachingOfferVisits(userId, { ...visits, dismissed: true });
}

export async function saveCoachingOfferVisits(
  userId: string,
  visits: CoachingOfferVisits,
): Promise<void> {
  try {
    await AsyncStorage.setItem(key(userId), JSON.stringify(visits));
  } catch {
    // Nothing to recover; the visit or dismissal is simply not remembered.
  }
}
