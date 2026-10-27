export interface CleanupItem {
  name: string;
  /** The model's estimate, in whole minutes. */
  minutes: number;
}

export interface CleanupPlan {
  title: string;
  objects: CleanupItem[];
  safetyNote: string | null;
}

/** Used when the function sends no estimate for an item, as an older deploy does. */
export const DEFAULT_ITEM_MINUTES = 2;
const MAX_ITEM_MINUTES = 15;

function shortText(value: unknown, maximum: number): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 && normalized.length <= maximum ? normalized : null;
}

function itemMinutes(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_ITEM_MINUTES;
  return Math.min(MAX_ITEM_MINUTES, Math.max(1, Math.round(value)));
}

/** The Edge Function is untrusted input too; a bad model response never reaches UI. */
export function parseCleanupPlan(value: unknown): CleanupPlan | null {
  if (value == null || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  // The slideshow never renders the model's title. Keep a safe local fallback
  // so an overly long or omitted title cannot discard a valid object queue.
  const title = shortText(record.title, 240) ?? 'Your cleaning plan';
  if (!Array.isArray(record.objects)) {
    return null;
  }
  const names = record.objects.map((object) => shortText(object, 120));
  if (names.length < 1 || names.length > 20 || names.some((name) => name == null)) {
    return null;
  }
  // Estimates only count when there is one per item, so none lands on the wrong one.
  const minutes = Array.isArray(record.minutes) && record.minutes.length === names.length
    ? record.minutes
    : [];
  const safetyNote = record.safetyNote === '' || record.safetyNote == null
    ? null
    : shortText(record.safetyNote, 220);
  if (record.safetyNote != null && record.safetyNote !== '' && safetyNote == null) return null;
  return {
    title,
    objects: (names as string[]).map((name, index) => ({ name, minutes: itemMinutes(minutes[index]) })),
    safetyNote,
  };
}

export function cleanupMinutes(items: readonly CleanupItem[]): number {
  return items.reduce((total, item) => total + item.minutes, 0);
}
