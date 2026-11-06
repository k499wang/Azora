import type { RootStackNavigationProp } from '../../app/navigation';
import {
  loadAiDataConsent,
  saveAiDataConsent,
} from '../../services/preferences/aiDataConsentPreference';

export type AiDataConsentNavigation = Pick<RootStackNavigationProp, 'navigate'>;

/** Long enough for the sheet to leave, so a photo picker opened next isn't dropped. */
const SHEET_DISMISS_MS = 400;

let settle: ((allowed: boolean) => void) | null = null;

/** The sheet's answer. Leaving it any other way, such as swiping down, is a no. */
export function settleAiDataConsent(allowed: boolean): void {
  settle?.(allowed);
  settle = null;
}

/** The question alone: records nothing, so Settings' dev row can preview it. */
export function askAiDataConsent(navigation: AiDataConsentNavigation): Promise<boolean> {
  settleAiDataConsent(false);
  return new Promise<boolean>((resolve) => {
    settle = resolve;
    navigation.navigate('AiDataConsent');
  });
}

/**
 * App Review 5.1.2(i): say what is sent and to whom, and get a yes, before any
 * personal data reaches a third-party AI. Every AI call waits on this.
 */
export async function ensureAiDataConsent(
  userId: string | null,
  navigation: AiDataConsentNavigation,
): Promise<boolean> {
  if (userId == null) return false;
  if (await loadAiDataConsent(userId)) return true;

  const allowed = await askAiDataConsent(navigation);
  if (!allowed) return false;
  await saveAiDataConsent(userId);
  await new Promise((resolve) => setTimeout(resolve, SHEET_DISMISS_MS));
  return true;
}
