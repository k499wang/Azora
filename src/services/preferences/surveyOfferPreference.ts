import AsyncStorage from '@react-native-async-storage/async-storage';

const SURVEY_OFFER_DISMISSED_KEY = 'home:survey_offer_dismissed';

export async function loadSurveyOfferDismissed(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(SURVEY_OFFER_DISMISSED_KEY)) === 'true';
  } catch {
    // A storage failure must not nag someone who already answered.
    return true;
  }
}

export async function setSurveyOfferDismissed(): Promise<void> {
  try {
    await AsyncStorage.setItem(SURVEY_OFFER_DISMISSED_KEY, 'true');
  } catch {
    // Nothing to recover; the offer simply comes back next launch.
  }
}

export async function clearSurveyOfferDismissed(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SURVEY_OFFER_DISMISSED_KEY);
  } catch {
    // Nothing to recover; the dev reset simply did not take.
  }
}
