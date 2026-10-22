import AsyncStorage from '@react-native-async-storage/async-storage';

/** `discount` is the free tier's survey-for-50%-off; `feedback` is Pro's in-app form. */
export type SurveyOfferKind = 'discount' | 'feedback';

const DISMISSED_KEYS: Record<SurveyOfferKind, string> = {
  discount: 'home:survey_offer_dismissed',
  feedback: 'home:pro_feedback_dismissed',
};

export async function loadSurveyOfferDismissed(kind: SurveyOfferKind): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(DISMISSED_KEYS[kind])) === 'true';
  } catch {
    // A storage failure must not nag someone who already answered.
    return true;
  }
}

export async function setSurveyOfferDismissed(kind: SurveyOfferKind): Promise<void> {
  try {
    await AsyncStorage.setItem(DISMISSED_KEYS[kind], 'true');
  } catch {
    // Nothing to recover; the offer simply comes back next launch.
  }
}

export async function clearSurveyOfferDismissed(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(Object.values(DISMISSED_KEYS));
  } catch {
    // Nothing to recover; the dev reset simply did not take.
  }
}
