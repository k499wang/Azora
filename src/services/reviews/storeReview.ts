import * as StoreReview from 'expo-store-review';

export async function requestStoreReview(): Promise<void> {
  try {
    if (await StoreReview.isAvailableAsync()) {
      await StoreReview.requestReview();
    }
  } catch {
    // Native review prompts are best-effort and should never block onboarding.
  }
}
