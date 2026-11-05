import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = 'enjoyment_prompt';
const SHOWN = 'shown';

/** The local date the user was first on Home, or `shown` once they have been asked. */
export type EnjoymentPromptRecord = string;

function storageKey(userId: string): string {
  return `${KEY_PREFIX}:${userId}`;
}

/**
 * Due on the first Home visit of any later calendar day, and never again after
 * that. Local dates sort as strings, so no date arithmetic is needed.
 */
export function isEnjoymentPromptDue(
  record: EnjoymentPromptRecord,
  todayLocalDate: string,
): boolean {
  return record !== SHOWN && todayLocalDate > record;
}

/** Reads the record, starting the clock on the first visit. */
export async function loadEnjoymentPromptRecord(
  userId: string,
  todayLocalDate: string,
): Promise<EnjoymentPromptRecord> {
  try {
    const stored = await AsyncStorage.getItem(storageKey(userId));
    if (stored != null) return stored;
    await AsyncStorage.setItem(storageKey(userId), todayLocalDate);
    return todayLocalDate;
  } catch {
    // A storage failure must not ask someone who may already have answered.
    return SHOWN;
  }
}

export async function markEnjoymentPromptShown(userId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(userId), SHOWN);
  } catch {
    // Nothing to recover; the sheet simply comes back next launch.
  }
}
